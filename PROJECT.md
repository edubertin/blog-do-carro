# Project

## Identity

- Product: Blog do Carro.
- Planned repository: `Edubertin/blog-do-carro`.
- Status: protótipo funcional, ainda não publicado.
- Audience: público brasileiro interessado em compra, venda e negociação de veículos; 87% de uso esperado em smartphones.
- Business goal: transformar os vídeos do canal Deu Negócio em um portal editorial e, depois, em comunidade, loja e marketplace.

## Current State

- Active phase: estabilização da Fase 0 e preparação do repositório.
- Production status: somente preview local; nenhum deploy autorizado.
- Release status: sem versão publicada, sem remoto e sem commits.
- Open decisions: autenticação do admin, schema D1, política de mídia R2 e homologação dos conectores.

## Stack

- App: `apps/site`, App Router compatível via Vinext, React e TypeScript estrito.
- Runtime: Vite e Cloudflare Worker empacotado para Sites.
- Database/storage: D1 e R2 reservados, atualmente desativados.
- Commerce: fluxo demonstrativo local, sem cobrança ou envio.
- Observability: ainda não conectada.

## Dependency Policy

- O gate bloqueante usa `npm audit --omit=dev`: a árvore de produção não possui vulnerabilidades conhecidas nesta revisão.
- O audit completo ainda reporta quatro avisos transitivos em `undici@7.28.0`, fixado pelo Miniflare alfa usado pelo toolchain Cloudflare.
- Não usar `npm audit fix --force`: a correção proposta rebaixa o plugin Cloudflare para uma versão incompatível com Vite 8.
- Revisar a exceção quando Cloudflare/Miniflare publicar uma matriz compatível que use `undici` corrigido.

## Repository Map

- `apps/site`: experiência pública, conteúdo e comércio demonstrativo.
- `docs`: plano de implementação, especificações e evidências duráveis.
- `.github`: CI, Dependabot, ownership e template de PR.
- `output`, `.playwright-cli`, `dist`, `.vinext`, `.wrangler`: artefatos locais ignorados.

## Commands

- Install: `npm ci`.
- Dev: `npm run dev`.
- Lint: `npm run lint`.
- Typecheck: `npm run typecheck`.
- Test: `npm test`.
- Build: `npm run build`.
- QA/CI: `npm run ci`.

## Specialist Context

- Regras globais do projeto: `AGENTS.md`.
- Regras do site: `apps/site/AGENTS.md`.
- Arquitetura futura: `docs/IMPLEMENTATION_PLAN.md`.
- Critérios do mock comercial: `docs/COMMERCE_MOCK_SPEC.md`.
- Próxima fundação de clientes: `docs/specs/customer-order-portal.md`.

## Safety

- Secrets: somente variáveis de ambiente/bindings; nunca em Git ou D1.
- User data: o protótipo não deve persistir dados pessoais.
- Generated outputs: ficam nos diretórios ignorados.
- Release gates: QA aprovado, revisão visual, auditoria de dependências de produção, escopo Git conferido e autorização explícita para publicar.
