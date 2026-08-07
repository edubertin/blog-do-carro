# Spec — Fundação local do D1

- Status: **bindings declarados, capacidades hospedadas desativadas por flags**
- Data: **2026-08-06**

## Objetivo

Preparar um modelo D1 evolutivo e testável para o CMS, a projeção pública, o catálogo e o control plane sem criar recursos externos, persistir dados reais ou alterar o comportamento atual do site.

## Entrega

- schema lógico tipado em `apps/site/db/schema.ts`;
- contratos de leitura pública e catálogo em `apps/site/db/contracts.ts`;
- adapter estrutural para o binding D1, sem dependência espalhada pela aplicação;
- adapter em memória para manter fixtures enquanto a persistência estiver desativada;
- composição server-side usada por home, menu, busca, artigo, categoria, sitemap e catálogo;
- migration `apps/site/drizzle/0001_d1_foundation.sql`, copiado pelo build do Sites;
- seed idempotente `apps/site/drizzle/0001_foundation_seed.sql`;
- testes em SQLite efêmero para DDL, índices, constraints, seed e ledgers append-only.

## Domínios do primeiro migration

| Domínio | Tabelas principais | Regra |
| --- | --- | --- |
| Control plane | `admin_principals`, `admin_role_assignments`, `connector_configurations`, `audit_events`, `idempotency_records` | Sem subject bruto, e-mail ou secret |
| Editorial | `articles`, `article_revisions`, categorias, FAQ, relacionados e vídeos | Artigo é identidade; conteúdo vive em revisão |
| Projeção pública | `published_article_projections`, `published_article_categories` | Nunca recebe rascunho ou revisão |
| Curadoria | `menus`, `menu_items`, `home_sections`, `home_items` | Home referencia entidades, sem duplicar conteúdo editorial |
| Catálogo | `products`, `product_variants`, `inventory_balances`, `inventory_movements`, `store_settings` | Produto, variante, modo da loja e estoque são estados distintos |

## Regras estruturais

- IDs internos são `TEXT`; timestamps são inteiros UTC em milissegundos.
- Dinheiro usa centavos inteiros e moeda `BRL` explícita.
- Slug, SKU e ID externo do YouTube possuem unicidade no banco.
- Artigo publicado pode receber nova revisão sem retirar a revisão atual do portal.
- A projeção pública armazena somente o snapshot sanitizado da revisão publicada.
- A busca pública consulta texto normalizado sem expor corpo, opinião ou FAQ na resposta ou no bundle cliente.
- Data oficial desconhecida permanece `NULL`; o portal não inventa `datePublished`.
- Menu, carrossel, leituras em destaque e relacionados possuem pontos de curadoria próprios, com fallback explícito no adapter.
- `audit_events` e `inventory_movements` são append-only por trigger.
- Operações com múltiplos statements usarão `D1.batch()`; não haverá DDL durante requests.
- Configuração de conector registra apenas estado observado; capacidade efetiva continua calculada no servidor.
- Nenhuma tabela ou repositório recebe valor de secret.

## Chaveiro Presente

O seed define:

- produto `prd_chaveiro_presente` em estado `preview`;
- variante `var_chp_demo_ed01` e SKU `CHP-DEMO-01`;
- preço ilustrativo de `R$ 29,90` em centavos;
- máximo de cinco itens no carrinho;
- inventário `untracked`, sem as antigas vinte unidades ilustrativas;
- loja em modo `demo` e checkout persistente desligado.

Esse registro não cria venda, estoque reservado ou pedido.

## Dados deliberadamente adiados

- autenticação e sessão de clientes;
- clientes, endereços e vínculo de pedidos;
- snapshots privados de checkout;
- pedidos, pagamentos, envios e webhooks;
- analytics de visitantes;
- uploads e metadados R2.

O modelo conceitual dessas áreas permanece nas specs existentes. A migration comercial exige ADR de separação/PII, política de retenção e aprovação específica.

## Ativação futura

1. revisar o SQL gerado e o diff do schema;
2. executar os contratos contra SQLite/D1 de preview;
3. comprovar o dispatcher e a autorização administrativa no Site definitivo;
4. criar binding D1 de preview pelo Sites;
5. aplicar migration somente no ambiente de preview;
6. executar testes negativos de rascunho, permissão, header forjado e ausência de secret;
7. migrar conteúdo atual para projeção publicada com timestamps verificados;
8. ativar CRUD editorial por flag server-side.

Produção pública continua em fixtures. O binding R2 existe somente para mídia staged autorizada; comércio continua fora desta entrega. Consulte o ADR 0007.
