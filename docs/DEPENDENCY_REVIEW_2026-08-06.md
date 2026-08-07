# Revisão dos PRs do Dependabot — 2026-08-06

## Decisão

Nenhum PR foi mesclado nesta revisão. Todos nasceram antes da nova suíte Playwright e alteram o mesmo `package-lock.json` desta branch; portanto precisam ser atualizados sobre a `main` após a integração deste trabalho e passar pelo CI completo novamente.

| PR | Mudança | Risco | Recomendação |
| --- | --- | --- | --- |
| [#1](https://github.com/edubertin/blog-do-carro/pull/1) | `@vitejs/plugin-react` 6.0.2 → 6.0.5 e `@vitejs/plugin-rsc` 0.5.26 → 0.5.32 | médio: patch no pipeline RSC/Vinext | atualizar, rodar renderização e Playwright, então avaliar merge isolado |
| [#2](https://github.com/edubertin/blog-do-carro/pull/2) | ESLint 9 → 10 e ferramentas associadas | alto: mudança major e lockfile amplo | não mesclar junto com produto; tratar como migração própria após compatibilidade dos plugins |
| [#3](https://github.com/edubertin/blog-do-carro/pull/3) | Vinext beta.2 → beta.4 | médio-alto: runtime ainda beta | testar isoladamente todas as rotas, imagens, worker e build Sites antes de considerar merge |
| [#4](https://github.com/edubertin/blog-do-carro/pull/4) | `@types/react` 19.2.14 → 19.2.18 | baixo: patch de tipos | melhor candidato; CI antigo passou, mas deve ser atualizado e validado com a suíte nova |
| [#5](https://github.com/edubertin/blog-do-carro/pull/5) | TypeScript 5.9.3 → 7.0.2 | alto: mudança major e pacotes binários por plataforma | adiar até Vinext, Vite e typescript-eslint declararem suporte conjunto e criar plano de migração |

## Segurança das dependências

- A árvore de produção passa em `npm audit --omit=dev --audit-level=high` sem vulnerabilidades conhecidas.
- O audit completo mantém avisos transitivos do toolchain local Cloudflare/Miniflare; eles não entram no bundle de produção.
- `npm audit fix --force` não deve ser usado porque a solução proposta altera versões incompatíveis do toolchain.

## Próxima rodada

1. Integrar esta branch e atualizar os PRs do Dependabot.
2. Processar primeiro o PR #4.
3. Processar #1 e #3 separadamente, com screenshots mobile/desktop e teste do worker.
4. Manter #2 e #5 bloqueados até uma rodada explícita de migração de ferramentas.
