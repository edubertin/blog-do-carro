# Project

## Identity

- Product: Blog do Carro.
- Repository: `Edubertin/blog-do-carro`.
- Status: protótipo funcional em repositório privado, ainda não publicado no Sites.
- Audience: público brasileiro interessado em compra, venda e negociação de veículos; 87% de uso esperado em smartphones.
- Business goal: transformar os vídeos do canal Deu Negócio em um portal editorial e, depois, em comunidade, loja e marketplace.

## Current State

- Active phase: estabilização da Fase 0 e validação do mock administrativo.
- Production status: somente preview local; nenhum deploy autorizado.
- Release status: repositório privado inicializado; sem versão publicada no Sites.
- Open decisions: fonte editorial CMS ou D1, provedor técnico da identidade administrativa, datas oficiais dos quatro vídeos, schema D1, política de mídia R2 e homologação dos conectores.

## Recorded Decisions

- Domínio canônico definitivo: `https://blogdocarro.com`.
- Duas identidades iniciais de owner foram fornecidas fora do repositório; os identificadores concretos ficam no provedor de identidade e/ou secrets do Sites, nunca na documentação ou no bundle.
- Pagamento futuro: Mercado Pago exclusivamente para Pix; integração real bloqueada por credenciais, webhooks, homologação e gates comerciais.
- Categorias sem artigos publicados permanecem vazias; não serão preenchidas com conteúdo gerado por IA.
- A fonte editorial continua pendente entre CMS e D1 e deve ser decidida antes do CRUD real.
- Registro detalhado: `docs/adr/`.

## Stack

- App: `apps/site`, App Router compatível via Vinext, React e TypeScript estrito.
- Runtime: Vite e Cloudflare Worker empacotado para Sites.
- Database/storage: D1 e R2 reservados, atualmente desativados.
- Commerce: fluxo demonstrativo local, sem cobrança ou envio; Mercado Pago Pix é apenas o destino futuro aprovado.
- Observability: fundação local com request ID e limite de erro; nenhum coletor externo conectado.

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
- Browser/a11y: `npm run test:e2e`.
- Build: `npm run build`.
- QA/CI: `npm run ci`.

## Specialist Context

- Regras globais do projeto: `AGENTS.md`.
- Regras do site: `apps/site/AGENTS.md`.
- Arquitetura futura: `docs/IMPLEMENTATION_PLAN.md`.
- Critérios do mock comercial: `docs/COMMERCE_MOCK_SPEC.md`.
- Próxima fundação de clientes: `docs/specs/customer-order-portal.md`.
- Central administrativa: `docs/specs/admin-control-plane.md`.
- Contrato de observabilidade: `docs/OBSERVABILITY.md`.
- Decisões arquiteturais: `docs/adr/`.

## Safety

- Secrets: somente variáveis de ambiente/bindings; nunca em Git ou D1.
- User data: o protótipo não deve persistir dados pessoais.
- Generated outputs: ficam nos diretórios ignorados.
- Release gates: QA aprovado, revisão visual, auditoria de dependências de produção, escopo Git conferido e autorização explícita para publicar.
