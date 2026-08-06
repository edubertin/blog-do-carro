# QA sistêmico — 2026-08-06

## Escopo

Revisão do portal público, fluxo comercial demonstrativo, SEO, Worker de imagens, responsividade, acessibilidade básica, dependências e preparação do repositório `Edubertin/blog-do-carro`.

## Gates automatizados

- Instalação limpa com `npm ci`: aprovada.
- Lint: aprovado.
- TypeScript estrito: aprovado.
- Build Vinext/Vite: aprovado.
- Testes do HTML renderizado: 34 aprovados.
- Playwright automatizado: 12 aprovados em Chromium mobile e desktop.
- Árvore de dependências de topo: aprovada, sem pacotes extraneous.
- Auditoria das dependências de produção: 0 vulnerabilidades.

## Playwright

- Viewports verificadas: 360 × 800, 390 × 844 e 1440 × 1000.
- Nenhum overflow horizontal em mobile ou desktop.
- Nenhuma imagem quebrada após carregar conteúdo lazy.
- Console final: 0 erros e 0 avisos da aplicação.
- Menu: foco inicial no fechamento, fundo inerte, `Escape` fecha e o foco retorna ao acionador.
- Produto: adicionar abre `/carrinho` e preserva o item no armazenamento local.
- Checkout: ao avançar, o foco chega ao título da nova etapa.
- Axe: nenhum achado crítico ou sério nas páginas de artigo e editor administrativo auditadas.
- YouTube: nenhum iframe ou pedido ao player existe antes da escolha explícita; o player aparece somente após o clique.
- A suíte de navegador sobe o artefato de produção com `vinext start` em porta isolada, não o servidor de desenvolvimento.

## Correções aplicadas

- O Worker aceita `/_next/image` e `/_vinext/image` e usa `fetch` como fallback local quando o binding `ASSETS` não existe.
- Categorias sem artigos mostram um estado vazio coerente.
- Datas editoriais de exibição foram separadas das datas ISO usadas em SEO.
- Artigos agora incluem canonical e schemas `Organization`, `BreadcrumbList`, `Article` e `FAQPage`; páginas públicas receberam canonical e descrição.
- A projeção pública filtra artigos por status e rascunhos não resolvem rota, busca, home, categoria ou sitemap.
- O player do YouTube usa uma fachada local e `youtube-nocookie` somente após ação do visitante.
- O Worker gera `X-Request-Id`; o admin recebeu CSP `frame-ancestors` e política de permissões restritiva.
- Checkout, carrinho e confirmação demonstrativa permanecem fora do índice.
- Newsletter, interesse e comentários declaram antes do envio que são simulações sem persistência.
- Busca cobre título, categoria, subtítulo e corpo; relacionados priorizam a mesma categoria.
- A lista sem analytics real passou a ser tratada como curadoria editorial.
- Menu e busca ganharam diálogo modal, contenção de foco, fechamento por `Escape` e retorno ao acionador.
- A troca de etapa do checkout move o foco para o novo título.
- O CTA do produto persiste o carrinho antes de abrir a revisão do pedido.

## Dependências

O audit completo mantém quatro avisos de desenvolvimento em `undici@7.28.0`, dependência exata do Miniflare alfa atual. A correção automática exige downgrade incompatível do plugin Cloudflare e não foi aplicada. O gate de produção permanece verde e a exceção deve ser revista no próximo upgrade coordenado de Vinext, Vite, Cloudflare e Wrangler.

## Limites conhecidos

- O build Vinext beta ainda classifica algumas rotas como `Unknown`; a própria ferramenta informa que sua análise estática será ampliada futuramente.
- D1, R2, analytics, autenticação, pagamentos e envio real continuam desativados.
- A transformação real de imagens pelo binding `IMAGES` precisa ser confirmada no ambiente Sites antes da publicação; localmente, o fallback entrega a imagem original.
- A loja suporta somente o Chaveiro Presente e o pedido é uma simulação local.

## Gate de publicação

Antes de publicar no Sites, repetir o Playwright no preview, verificar bytes das imagens mobile com `IMAGES` e obter autorização explícita para o deploy. O domínio canônico definitivo está registrado como `blogdocarro.com`.
