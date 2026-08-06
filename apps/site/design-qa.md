# Design QA — Blog do Carro

## Comparison target

- Source visual truth: `apps/site/design/option-2-source.png`
- Implementation route: `http://127.0.0.1:3000/`
- Mobile viewport: `390 × 843`
- Desktop viewport: `1440 × 1000`
- State: home no topo, tema escuro, menus fechados
- Combined comparison: `output/playwright/18-design-comparison-mobile.png`

## Intentional product changes

- O hero editorial estático foi substituído por um carrossel manual com os quatro vídeos mais recentes do canal.
- A imagem do vídeo funciona como pôster; o movimento acontece na troca e no gesto de arrastar, sem autoplay pesado.
- As categorias em chips foram substituídas por um índice editorial organizado por intenção.
- O card do chaveiro passou a abrir uma loja interna e uma página de validação de interesse.

## Comparison evidence

- Mobile home: `output/playwright/08-hero-cropped-mobile.png`
- Mobile categories anchor: `output/playwright/19-categories-anchor-mobile.png`
- Mobile store: `output/playwright/20-store-mobile-final-top.png`
- Mobile product: `output/playwright/14-product-mobile.png`
- Desktop home: `output/playwright/17-home-desktop.png`
- Desktop store: `output/playwright/22-store-desktop-final.png`

## Findings and fixes

- [P2] Controles do YouTube apareciam no pôster do hero.
  - Fix: recorte vertical central e assets com cache-bust; o conteúdo do vídeo permanece, os controles deixam de competir com a interface.
- [P2] A âncora de categorias escondia o título sob o cabeçalho fixo.
  - Fix: o `id` passou para o início da seção e ganhou `scroll-margin-top`.
- [P2] O produto ficava cortado no card desktop da loja.
  - Fix: proporção da grade ajustada e imagem renderizada inteira com `object-fit: contain`.
- [P2] O card compacto da home mostrava um fragmento do balão de fala.
  - Fix: o recorte foi direcionado ao chaveiro; o mock completo permanece na loja e na página do produto.

## Interaction and accessibility checks

- Carrossel: setas, indicadores, swipe e quatro estados verificados.
- Navegação: menu, âncora de categorias e links Loja/Produto verificados.
- Formulário: preenchimento, quantidade, consentimento e estado de sucesso verificados.
- Artigo: breadcrumb, imagem, opinião, player, FAQ, relacionados e comentários presentes.
- Console do navegador: zero erros e zero avisos no estado final verificado.
- Redução de movimento respeitada via `prefers-reduced-motion`.

## Final result

Nenhum achado P0, P1 ou P2 aberto.

final result: passed
