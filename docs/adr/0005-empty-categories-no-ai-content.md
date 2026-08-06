# ADR 0005 — Categorias vazias permanecem vazias

- Status: **aceita**
- Data: **2026-08-06**

## Contexto

Algumas categorias ainda não possuem artigos publicados. Preenchê-las automaticamente criaria conteúdo sem apuração e reduziria a confiança editorial.

## Decisão

- categoria sem artigo publicado mostra um estado vazio honesto;
- não gerar, completar ou publicar artigos com IA para ocupar espaço;
- conteúdo só entra na categoria após autoria e revisão editorial humanas;
- o vazio não é substituído por conteúdo de outra categoria nem por fixtures apresentadas como reais.

## Consequências

O produto pode manter categorias planejadas na navegação quando isso ajudar a comunicar o escopo futuro, mas a ausência de conteúdo deve ser explícita. SEO e visibilidade dessas páginas podem ser ajustados sem violar esta decisão.
