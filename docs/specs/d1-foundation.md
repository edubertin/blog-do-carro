# Spec — Fundação local do D1

- Status: **D1 ativo em produção; R2 público ainda fail-closed**
- Data: **2026-08-06**

## Objetivo

Documentar o modelo D1 em produção para o CMS, a projeção pública, o catálogo e o control plane, preservando isolamento entre rascunhos, publicação e comércio demonstrativo.

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

## Catálogo atual

O catálogo define dois estados comerciais distintos:

- chaveiro disponível no fluxo demonstrativo por `R$ 9,90`, armazenado em centavos;
- miniatura em `coming_soon`, visível na vitrine, sem preço, CTA ou inclusão válida no carrinho;
- máximo de cinco chaveiros no carrinho;
- inventário `untracked` e loja em modo `demo`;
- checkout persistente desligado.

Esse registro não cria venda, estoque reservado ou pedido.

## Dados deliberadamente adiados

- autenticação e sessão de clientes;
- clientes, endereços e vínculo de pedidos;
- snapshots privados de checkout;
- pedidos, pagamentos, envios e webhooks;
- analytics de visitantes;
- publicação pública de uploads e derivados R2, até homologação.

O modelo conceitual dessas áreas permanece nas specs existentes. A migration comercial exige ADR de separação/PII, política de retenção e aprovação específica.

## Operação e evolução

1. criar somente migrations aditivas e revisar SQL e schema;
2. executar contratos contra SQLite efêmero e D1 de homologação;
3. testar rascunho, permissão, header forjado e ausência de secret;
4. aplicar primeiro em homologação e validar backup/rollback;
5. aplicar em produção somente após os gates;
6. ativar capacidades novas por flag server-side independente;
7. manter a projeção publicada anterior durante falhas.

Produção usa leitura pública projetada do D1 e escritas CMS autorizadas. O binding R2 existe somente para mídia staged autorizada até a homologação descrita em `structured-editor-media.md`; comércio real continua fora desta entrega. Consulte os ADRs 0007 e 0008.
