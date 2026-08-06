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

## Arquitetura alvo

```text
apps/site (Vinext + Vite + worker Cloudflare)
├── experiência pública
├── área editorial protegida
├── marketplace e conta do usuário
└── rotas de integração

Sites
├── publicação do worker e assets
├── D1 futuro: conteúdo, comércio e métricas agregadas
├── R2 futuro: mídia própria
└── conectores futuros: pagamentos, frete, e-mail e observabilidade
```

O conteúdo editorial e os dados transacionais devem permanecer separados. Artigos, autores, categorias, menus e páginas vivem no CMS; usuários, favoritos, anúncios, pedidos e eventos de pagamento vivem no banco da aplicação.

### Padrão de publicação no Sites

- Preservar o `project_id` quando `apps/site/.openai/hosting.json` for criado pelo fluxo oficial do Sites.
- Usar Vinext com Vite e worker Cloudflare, seguindo a estrutura da Plimcor.
- Reservar D1 para dados transacionais e R2 para mídia própria quando esses recursos entrarem no produto.
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

Configurações da página inicial, menu e newsletter devem ser documentos próprios no CMS, editáveis sem alteração de código.

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

- Ativar D1 e migrar o conteúdo de demonstração para o modelo editorial.
- Criar painel com autenticação, sessão segura e perfis de editor e administrador.
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
- Adaptadores isolados para Login Mercado Livre, PayPix e Meu Envio após homologação.
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
| `/admin/integracoes` | status e configuração dos conectores permitidos |

O editor salva automaticamente, alerta sobre alterações não publicadas e separa claramente `Salvar rascunho`, `Enviar para revisão`, `Agendar` e `Publicar`. A publicação exige validação de slug, SEO, imagem, categoria, vídeo, opinião e FAQ.

### Modelo de dados inicial no D1

- Editorial: `articles`, `article_revisions`, `authors`, `categories`, `article_categories`, `faqs`, `menus` e `home_sections`.
- Vídeo: `youtube_videos`, vinculando ID, canal, metadados de origem, pôster e artigo.
- Loja: `products`, `product_variants`, `inventory_movements` e `store_settings`.
- Administração: `admin_users`, `roles`, `sessions` e `audit_log`.
- Analytics: eventos brutos com retenção curta e tabelas diárias agregadas por rota, origem e dispositivo.
- Comércio real, somente na Fase 3: `customers`, `addresses`, `orders`, `order_items`, `payments`, `shipments` e `webhook_events`.

### Analytics

- Capturar apenas eventos necessários: visualização de página e artigo, vídeo iniciado, busca, newsletter, produto visto e início do checkout.
- Excluir dados pessoais dos eventos; IP não será persistido e parâmetros sensíveis serão descartados na borda.
- Exibir período, visitantes, sessões, páginas vistas, artigos líderes, origem, dispositivo e funil da loja.
- Processar agregações fora da leitura pública para que o dashboard não degrade a navegação do portal.

### Conectores

Cada integração terá um adaptador isolado, configuração por variável de ambiente, estado `desconectado`, `teste` ou `ativo`, teste de saúde e log sanitizado. Mercado Livre, PayPix e Meu Envio continuarão `desconectados` até homologação. Nenhuma chave ou token será salvo em artigo, produto, D1 ou código.

## Estado atual

- Fase 0 implementada e estabilizada no runtime Vinext/Sites.
- Build empacota o worker, assets e `.openai/hosting.json`.
- D1 e R2 permanecem `null`; não existe efeito externo de pagamento ou envio.
- Carrossel, conteúdo editorial, loja e checkout demonstrativo estão prontos para validação visual.
- Próximo corte recomendado: autenticação do admin, schema editorial D1, migrações e CRUD de artigos antes de analytics ou comércio real.

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
- Manter Login Mercado Livre, PayPix, Meu Envio, cobrança e pedido persistente desligados.

### Venda futura

- Ativar pedido e pagamento somente depois de validar fornecedor, amostra física, lote mínimo, preço, embalagem, frete, troca e política de privacidade.
- Reaproveitar o padrão transacional do Plimcor, mantendo catálogo e checkout separados do conteúdo editorial.
- Mercado Pago Checkout Bricks é o candidato inicial para Pix e cartão dentro do site; pedidos, estoque e webhooks continuam no servidor da aplicação.
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
- Checkout exige regras comerciais, frete, estoque, política de troca e conta de pagamento antes de implementação.
- Tabela FIPE e calculadora dependem da escolha de provedores e dos termos de uso de cada fonte.
- Marketplace aumenta muito o escopo de privacidade, moderação, fraude e suporte; entra somente após a base editorial estar estável.
