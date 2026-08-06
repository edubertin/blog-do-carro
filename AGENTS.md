# Instruções do projeto — Blog do Carro

## Contexto obrigatório

- Mapa rápido: `PROJECT.md`.
- Arquitetura e fases: `docs/IMPLEMENTATION_PLAN.md`.
- Regras da aplicação: `apps/site/AGENTS.md`.
- Especificação do comércio demonstrativo: `docs/COMMERCE_MOCK_SPEC.md`.

## Comandos

- Instalação reproduzível: `npm ci`.
- Desenvolvimento: `npm run dev`.
- Build de produção: `npm run build`.
- Verificação completa: `npm run ci`.

## Limites

- Publicação exclusiva pelo Sites; não introduza Vercel ou outro provedor.
- Não ative D1, R2, autenticação, pagamento, frete ou conectores sem aprovação explícita.
- Não transforme o checkout demonstrativo em compra real.
- Não leia nem versione `.env`, credenciais, sessões ou artefatos do navegador.
- Commit, push, PR e publicação exigem pedido explícito na mensagem atual.

## Git e artefatos

- `apps/site`, `docs` e os arquivos raiz são fonte versionável.
- `output`, `.playwright-cli`, `dist`, `.vinext`, `.wrangler` e caches são locais e ignorados.
- Antes de preparar GitHub, rode `npm run ci` e confira `git status --short --untracked-files=all`.
