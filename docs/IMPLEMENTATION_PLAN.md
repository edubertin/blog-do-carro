# Plano de implementação — Blog do Carro

## Resultado pretendido

Construir um portal automotivo brasileiro com experiência de aplicativo, prioridade absoluta para smartphones e uma base técnica capaz de receber conteúdo editorial, comunidade e comércio sem reconstrução.

## Decisões da primeira versão

- App Router e TypeScript estrito sobre a camada de compatibilidade do Vinext.
- Publicação exclusiva no Sites, com Vite e worker Cloudflare conforme o padrão validado na Plimcor.
- Aplicativo mantido em `apps/site`, que também será a raiz de build e publicação.
- Renderização estática dos artigos sempre que possível, com revalidação após publicação.
- Interface mobile-first para a faixa principal de 360 a 430 px.
- Identidade Deu Negócio: preto `#0D0D0D`, amarelo `#F4B400`, branco e cinzas neutros.
- Motion discreto, com respeito a `prefers-reduced-motion`.
- Imagens editoriais responsivas pela API compatível `next/image`, atendida pelo worker Vinext.
- Produto “Chaveiro Presente” com fluxo de compra demonstrativo, sem cobrança, persistência ou envio.
- Domínio canônico definitivo `https://blogdocarro.com`.
- Mercado Pago como único destino futuro de pagamento, exclusivamente para Pix e ainda bloqueado.
- Categorias sem conteúdo publicado permanecem vazias; o produto não gera artigos com IA para preenchê-las.

### Registro de decisões

- `docs/adr/0001-editorial-source-pending.md`: CMS interno com D1 como fonte editorial única e projeção publicada.
- `docs/adr/0002-admin-identity-provisioning.md`: Sites/ChatGPT SIWC, RBAC e bootstrap server-side de owner fora do Git.
- `docs/adr/0003-canonical-domain.md`: `blogdocarro.com` é a origem canônica.
- `docs/adr/0004-mercado-pago-pix-only.md`: Mercado Pago somente Pix, sem ativação real.
- `docs/adr/0005-empty-categories-no-ai-content.md`: categorias vazias não recebem conteúdo gerado.
- `docs/adr/0006-d1-foundation-without-pii.md`: primeiro migration D1 local sem PII, cliente, pagamento ou envio.

## Arquitetura alvo

```text
apps/site (Vinext + Vite + worker Cloudflare)
├── experiência pública
├── área editorial protegida
├── marketplace e conta do usuário
└── rotas de integração

Sites
├── publicação do worker e assets
├── D1 futuro: editorial, administração, comércio e métricas
├── R2 futuro: mídia própria
└── conectores futuros: pagamentos, frete, e-mail e observabilidade
```

O conteúdo editorial e os dados transacionais devem permanecer separados por domínio. D1 será a única fonte de verdade de artigos, revisões, autores, categorias, menus, páginas e composição da home; usuários, favoritos, anúncios, pedidos e eventos de pagamento vivem em tabelas próprias. Uma interface de repositório server-side isola o domínio da persistência, e o portal público sempre consome uma projeção somente de conteúdo publicado.

### Padrão de publicação no Sites

- Preservar o `project_id` quando `apps/site/.openai/hosting.json` for criado pelo fluxo oficial do Sites.
- Usar Vinext com Vite e worker Cloudflare, seguindo a estrutura da Plimcor.
- Reservar D1 para o CMS interno e demais domínios aprovados, e R2 para mídia própria quando esses recursos entrarem no produto.
- Manter scripts de build, qualidade e segurança centralizados na raiz do workspace.
- Não adicionar configuração ou dependência de publicação para provedores externos ao Sites.

## Modelo editorial

Todo artigo deve exigir os campos:

1. título, subtítulo, slug e descrição SEO;
2. imagem principal com texto alternativo;
3. categoria, autor, data e tempo de leitura;
4. conteúdo estruturado;
5. bloco “Minha opinião”;
6. URL ou ID de vídeo do YouTube;
7. FAQ;
8. artigos relacionados;
9. status `rascunho`, `revisão`, `agendado` ou `publicado`.

Configurações da página inicial, menu e newsletter devem ser documentos próprios no CMS interno, editáveis sem alteração de código.

Categorias sem artigos publicados exibem um estado vazio honesto. Nenhum artigo será gerado ou publicado por IA apenas para preencher uma categoria.

## Fases

### Fase 0 — protótipo validável

- Home responsiva baseada na direção visual escolhida.
- Menu, busca, categorias e navegação inferior funcionais.
- Página completa de artigo e páginas institucionais.
- Página do Chaveiro Presente com preço ilustrativo, quantidade e entrada no carrinho.
- Carrossel editorial sincronizável com os quatro vídeos mais recentes do canal Deu Negócio.
- Loja da Comunidade com catálogo inicial e jornada demonstrativa até a confirmação.
- Metadados, Open Graph, dados estruturados e rotas amigáveis.

### Fase 1 — fundação editorial

- Implementar a interface de repositório editorial e o schema aprovado antes do CRUD real.
- Ativar D1 somente em preview, para os domínios aprovados e com migrations versionadas.
- Proteger o painel com Sites/ChatGPT SIWC, autorização server-side, RBAC e bootstrap de owner fora do Git.
- Implementar preview, rascunho, agendamento, publicação e histórico de alterações.
- Configurar sitemap, feed, redirects e revalidação automática.
- Ativar R2 para uploads com validação de tipo, tamanho, dimensões e texto alternativo obrigatório.

### Fase 2 — crescimento e comunidade

- Busca indexada e analytics first-party de conteúdo.
- Newsletter real com consentimento e descadastro.
- Comentários com moderação e proteção contra abuso.
- Cadastro, favoritos e preferências do leitor.

### Fase 3 — comércio

- Catálogo, estoque e variações do Chaveiro Presente.
- Carrinho e checkout no servidor seguindo o padrão já validado no Plimcor.
- Acesso passwordless por magic link e área **Meus pedidos**, conforme `docs/specs/customer-order-portal.md`.
- Adaptadores isolados para Login Mercado Livre, Mercado Pago exclusivamente para Pix e Meu Envio após homologação.
- Pagamento com idempotência, webhook assinado e reconciliação.
- Política de entrega, trocas, privacidade e suporte.

### Fase 4 — marketplace automotivo

- Área do anunciante e moderação de anúncios.
- Fotos, características, localização aproximada e status do veículo.
- Favoritos, comparador, financiamento e integração com Tabela FIPE.
- Proteções contra fraude, abuso e exposição de dados pessoais.

## SEO e desempenho

- `Article`, `BreadcrumbList`, `FAQPage`, `Organization` e, futuramente, `Product` em JSON-LD.
- Canonical, Open Graph e descrição individual por rota.
- Imagens com tamanhos explícitos, formatos modernos e prioridade apenas no conteúdo acima da dobra.
- Orçamento inicial: LCP até 2,5 s, CLS até 0,1 e INP até 200 ms no percentil 75 mobile.
- Evitar JavaScript de cliente em conteúdo editorial; hidratar somente menus, busca, formulários e motion.

## Painel administrativo

O painel será um conjunto protegido dentro do mesmo aplicativo, sem um segundo projeto ou provedor:

| Rota | Responsabilidade |
| --- | --- |
| `/admin` | resumo operacional, rascunhos, alertas e atalhos |
| `/admin/analytics` | visitantes, sessões, artigos, origem, dispositivo e conversão editorial |
| `/admin/artigos` | listar, filtrar, criar, revisar, agendar e publicar |
| `/admin/artigos/novo` | editor estruturado com vídeo do YouTube, opinião, FAQ e SEO |
| `/admin/home` | ordenar hero, artigos, categorias, mais lidos e vitrine da loja |
| `/admin/menu` | editar navegação e categorias exibidas |
| `/admin/loja/produtos` | criar, editar, ativar e remover produtos do catálogo |
| `/admin/loja/configuracoes` | identidade da loja, políticas e parâmetros comerciais |
| `/admin/pedidos` | fila operacional, estados, eventos e exceções dos pedidos |
| `/admin/integracoes` | status e configuração dos conectores permitidos |
| `/admin/seguranca` | papéis, sessões, permissões, flags e trilha de auditoria |

O editor salva automaticamente, alerta sobre alterações não publicadas e separa claramente `Salvar rascunho`, `Enviar para revisão`, `Agendar` e `Publicar`. A publicação exige validação de slug, SEO, imagem, categoria, vídeo, opinião e FAQ.

### Modelo de dados inicial no D1

- Editorial: `articles`, `article_revisions`, `authors`, `categories`, categorias e FAQs por revisão, `menus` e `home_sections`, acessados por interface de repositório e separados da projeção publicada.
- Vídeo: `youtube_videos`, vinculando ID, canal, metadados de origem, pôster e artigo.
- Loja: `products`, `product_variants`, `inventory_balances`, `inventory_movements` e `store_settings`.
- Administração: `admin_principals`, atribuições de papel, `audit_events` e idempotência; a sessão SIWC e a matriz de permissões permanecem sob responsabilidade do Sites e do código server-side.
- Analytics: eventos brutos com retenção curta e tabelas diárias agregadas por rota, origem e dispositivo.
- Comércio real, somente em migration futura da Fase 3: clientes, endereços, pedidos, detalhes privados, itens, pagamentos, envios e webhooks, após ADR de PII e retenção.

### Analytics

- Capturar apenas eventos necessários: visualização de página e artigo, vídeo iniciado, busca, newsletter, produto visto e início do checkout.
- Excluir dados pessoais dos eventos; IP não será persistido e parâmetros sensíveis serão descartados na borda.
- Exibir período, visitantes, sessões, páginas vistas, artigos líderes, origem, dispositivo e funil da loja.
- Processar agregações fora da leitura pública para que o dashboard não degrade a navegação do portal.

### Conectores

Cada integração terá um adaptador isolado, configuração por variável de ambiente, estados separados de modo, configuração, saúde e ativação, teste de saúde e log sanitizado. Mercado Livre, Mercado Pago Pix e Meu Envio continuarão `desconectados` até homologação. O painel mostra somente nomes e estado dos secrets; valores são inseridos e rotacionados exclusivamente pelo mecanismo de secrets do Sites. Nenhuma chave ou token será recebida pelo painel ou salva em artigo, produto, D1 ou código.

O bootstrap inicial de owner será executado exclusivamente no servidor, por SIWC e provisionamento e/ou secrets do Sites fora do Git. O fallback temporário por e-mail exige flag server-side explícita, existe apenas para capturar os IDs estáveis do Sites e será desligado antes de dados reais. Identificadores pessoais não fazem parte da configuração versionada, e identidade, sessão e autorização administrativas permanecem separadas da conta de cliente.

A especificação completa do painel, RBAC, audit log, conectores e limites do mock está em `docs/specs/admin-control-plane.md`.

## Estado atual

- Fase 0 implementada e estabilizada no runtime Vinext/Sites.
- Build empacota o worker, assets e `.openai/hosting.json`.
- D1 e R2 permanecem `null`; não existe efeito externo de pagamento ou envio.
- O primeiro migration D1 e seu seed não sensível estão versionados e passam em SQLite efêmero; nenhum binding foi criado ou aplicado.
- Carrossel, conteúdo editorial, busca, loja e checkout demonstrativo consomem contratos server-side e estão prontos para validação visual.
- O mock administrativo local cobre todas as rotas da matriz com fronteira SIWC/owner, sem persistência real, secrets ou chamadas externas.
- A projeção pública já alimenta home, navegação, artigo, relacionados, categorias, sitemap e catálogo; corpos editoriais e SQL não entram nos chunks do navegador.
- Próximo corte recomendado: validar o adapter D1 em preview isolado e implementar o publicador transacional antes de qualquer CRUD real.

## Spike — vídeo novo para artigo e carrossel

### Fluxo recomendado

1. Uma notificação do canal cria automaticamente um rascunho editorial com `youtubeVideoId`, título, descrição, data e miniaturas.
2. O editor escolhe o quadro próximo de cinco segundos a partir do arquivo original do canal e confirma o recorte vertical. O site salva um pôster otimizado; não baixa o vídeo do YouTube em tempo de execução.
3. O rascunho recebe pergunta editorial, subtítulo, categoria, análise, opinião, FAQ e relacionados.
4. Ao publicar, a home revalida e o novo artigo entra na primeira posição do carrossel.

### Integração técnica

- Preferir notificações push do YouTube Data API para uploads e atualizações do canal.
- Usar a playlist de uploads como rotina de reconciliação, evitando duplicidade por `youtubeVideoId`.
- Manter o hero com imagem estática otimizada no carregamento inicial. Uma prévia silenciosa de cinco segundos pode ser testada depois, apenas para o item ativo e sem prejudicar dados móveis ou acessibilidade.
- Tratar o título original do YouTube como fonte; pergunta, chamada e análise permanecem campos editoriais separados.

## Spike — Loja da Comunidade

### Primeira validação

- Usar a rota interna `/loja` como catálogo e `/loja/chaveiro-presente` como página do produto.
- Percorrer produto, carrinho, identificação, entrega, Pix, revisão e confirmação em modo demonstrativo.
- Persistir somente produto e quantidade; dados pessoais permanecem na memória da página.
- Manter Login Mercado Livre, Mercado Pago, Meu Envio, cobrança e pedido persistente desligados.

### Venda futura

- Ativar pedido e pagamento somente depois de validar fornecedor, amostra física, lote mínimo, preço, embalagem, frete, troca e política de privacidade.
- Reaproveitar o padrão transacional do Plimcor, mantendo catálogo e checkout separados do conteúdo editorial.
- Mercado Pago é o destino aprovado exclusivamente para Pix; cartão e outros meios ficam fora do primeiro corte. Credenciais, criação de pagamentos e webhooks continuam bloqueados até homologação, conforme `docs/adr/0004-mercado-pago-pix-only.md`.
- Evolução sugerida: lista de interesse → pré-venda limitada → primeiro drop → catálogo recorrente.

## Critérios de aceite do MVP editorial

- Uma pessoa sem conhecimento técnico cria, revisa e publica um artigo completo.
- A home pode ser reorganizada pelo painel sem deploy.
- Navegação, busca e leitura funcionam confortavelmente com uma mão em 360 px.
- Todas as páginas públicas têm título, descrição, canonical e compartilhamento social.
- Não existe rota capaz de cobrar antes da validação comercial, logística e jurídica do produto.
- O projeto passa por lint, build, auditoria de acessibilidade e validação visual mobile e desktop.

## Riscos e limites

- A história do “Presente” é tratada como repertório interno da comunidade; o texto final deve ser validado com o proprietário da marca.
- As datas de publicação dos quatro vídeos ainda precisam ser confirmadas na fonte oficial; até lá, o schema omite `datePublished` em vez de inventar uma data.
- Checkout exige regras comerciais, frete, estoque, política de troca e conta de pagamento antes de implementação.
- Tabela FIPE e calculadora dependem da escolha de provedores e dos termos de uso de cada fonte.
- Marketplace aumenta muito o escopo de privacidade, moderação, fraude e suporte; entra somente após a base editorial estar estável.
