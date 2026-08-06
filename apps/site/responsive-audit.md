# Auditoria responsiva — Blog do Carro

## Escopo

- Superfícies: home, carrossel, Mais lidos, artigo e produto.
- Viewports inspecionados: 320, 360, 390, 430, 768, 1024 e 1440 px.
- Objetivo: preservar a experiência mobile-first e garantir uma transição estável para tablet e desktop.
- Ferramenta de captura: navegador controlado com Playwright.

## Resultado geral

Saudável. Não há overflow horizontal nos viewports testados e os problemas responsivos de maior impacto foram corrigidos.

Na validação final da build de produção, todas as larguras do `body` e do documento coincidiram com o viewport. O navegador não registrou erros nem avisos nas rotas verificadas.

## Etapas e saúde

1. **Hero mobile — saudável**
   - Frames reais aos cinco segundos, sem controles sobrepostos.
   - Título interno do vídeo centralizado e pergunta editorial legível.
   - Evidência: `output/playwright/responsive-audit/19-compare-home-360.png`.

2. **Carrossel — saudável**
   - Setas, indicadores e troca animada permanecem acessíveis em 360 px.
   - Evidência: `output/playwright/responsive-audit/10-after-carousel-slide-2-360-stable.png`.

3. **Transição para tablet — saudável**
   - O layout intermediário deixou de usar colunas rígidas de desktop.
   - Texto, imagem e ações permanecem visíveis em 768 px.
   - Evidência: `output/playwright/responsive-audit/20-compare-home-768.png`.

4. **Mais lidos — saudável**
   - Uma coluna no celular e duas colunas em tablet/desktop.
   - A seção ocupa toda a largura editorial no desktop.
   - Evidência: `output/playwright/responsive-audit/21-compare-most-read-1440.png`.

5. **Artigo — saudável**
   - Título reduzido no tablet e imagem principal preservada.
   - Evidência: `output/playwright/responsive-audit/22-after-article-768-final.png`.

6. **Produto — saudável**
   - Tablet mantém imagem completa, hierarquia e formulário em fluxo vertical.
   - Evidência: `output/playwright/responsive-audit/18-after-product-768.png`.

## Correções aplicadas

- Novo breakpoint de layout completo em 1024 px.
- Grid intermediário do hero com colunas flexíveis.
- `sizes` responsivo das imagens alinhado aos novos breakpoints.
- Frames do YouTube extraídos do vídeo sem a interface do player.
- Mais lidos ganhou contêiner próprio, reflow e estados de interação.
- Tipografia do artigo ajustada para tablet.
- Propriedades de carregamento de imagem atualizadas para Next.js 16.

## Qualidade técnica

- `npm run lint`: aprovado.
- `npm run build`: aprovado, com 30 páginas estáticas geradas.
- `npm audit --omit=dev --audit-level=high`: nenhuma vulnerabilidade encontrada.
- Home, artigo e loja validados na build de produção em navegador real.

## Acessibilidade e limites

- Alvos principais continuam com pelo menos 42–44 px.
- Carrossel possui nomes acessíveis, estado atual e alternativa sem autoplay.
- `prefers-reduced-motion` continua respeitado.
- Screenshots não comprovam compatibilidade completa com leitores de tela; semântica e foco foram inspecionados no DOM, mas um teste assistivo dedicado continua sendo uma etapa separada.
