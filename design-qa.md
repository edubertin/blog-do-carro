# Design QA — Ícone BDC

- Source visual truth: `C:/Users/edube/AppData/Local/Temp/codex-clipboard-ce101f57-481d-4a40-b822-03b02f6a9ee0.png`
- Implemented asset: `apps/site/public/brand/blog-do-carro-icon.png`
- Implementation screenshot: `output/playwright/icon-comparison.png`
- Source pixels: 1254 × 1254
- Implementation pixels: 1254 × 1254
- Comparison viewport: 1400 × 850 CSS pixels
- Device scale factor: 1
- State: source and versioned asset apresentados lado a lado, sem recorte ou transformação
- Density normalization: não necessária; os arquivos possuem dimensões e SHA-256 idênticos

## Full-view comparison evidence

O comparativo lado a lado confirma a mesma composição quadrada, silhueta do automóvel, borda amarela, fundo preto e monograma branco/amarelo. Não há diferença visível de escala, cor, recorte, nitidez, compressão ou área de respiro.

## Focused region comparison evidence

Uma segunda região focada não foi necessária porque o ativo implementado é uma cópia binária exata do original. Carro, monograma e borda já aparecem legíveis no comparativo em escala suficiente.

## Fidelity surfaces

- Fonts and typography: o texto `BDC` pertence ao raster aprovado e foi preservado; nenhuma fonte HTML tenta recriá-lo.
- Spacing and layout rhythm: proporção quadrada e respiro interno preservados; a mudança não altera o layout das páginas.
- Colors and visual tokens: preto, amarelo e branco correspondem exatamente ao arquivo aprovado.
- Image quality and asset fidelity: cópia sem reamostragem, recorte, recompressão ou substituição por SVG/CSS.
- Copy and content: nome curto `BDC` e nome acessível `Blog do Carro` definidos no manifesto e nos metadados.

## Browser verification

- a home abriu em `http://localhost:3000/` sem erro de console;
- o navegador encontrou o manifesto, o Apple Touch Icon e o tema `#0D0D0D`;
- o favicon legado foi removido para evitar concorrência com o novo símbolo;
- navegação e fluxos principais continuaram aprovados em mobile e desktop.

## Findings

Nenhum P0, P1 ou P2. As variantes 180, 192, 512 e `maskable` são um gate futuro da PWA, não uma divergência deste corte.

## Comparison history

Primeira comparação aprovada; nenhuma correção visual foi necessária.

final result: passed
