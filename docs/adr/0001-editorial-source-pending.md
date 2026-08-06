# ADR 0001 — Fonte editorial permanece pendente

- Status: **pendente**
- Data: **2026-08-06**

## Contexto

O plano cita CMS para conteúdo e D1 para a fundação do produto. Escolher os dois como fonte de verdade criaria sincronização, conflito de versões e risco de rascunho chegar ao portal público.

## Decisão

A escolha entre CMS e D1 permanece pendente. Nenhum schema ou CRUD editorial real deve ser iniciado antes da decisão. Independentemente da tecnologia, o portal consumirá uma projeção somente de conteúdo publicado.

## Critérios

- experiência de edição, revisão, agendamento e preview;
- versionamento, auditoria e rollback editorial;
- integração com YouTube e mídia R2;
- revalidação do portal e desempenho no Sites/Vinext;
- custo operacional, exportação e portabilidade;
- separação inequívoca entre rascunho e publicação.

## Consequências

D1 pode avançar para administração, comércio e auditoria sem antecipar a fonte editorial. A decisão final exigirá ADR próprio e prova de fluxo com uma pessoa editora não técnica.
