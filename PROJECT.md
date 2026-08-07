# Project

## Identity

- Product: Blog do Carro.
- Repository: `Edubertin/blog-do-carro`.
- Status: protótipo funcional em repositório privado, com projeto Sites provisionado para homologação protegida.
- Audience: público brasileiro interessado em compra, venda e negociação de veículos; 87% de uso esperado em smartphones.
- Business goal: transformar os vídeos do canal Deu Negócio em um portal editorial e, depois, em comunidade, loja e marketplace.

## Current State

- Active phase: fundação da Fase 1; fronteira SIWC/owner em homologação por preview protegido do Sites.
- Production status: somente preview protegido autorizado; D1, R2, dados reais e conectores continuam desligados.
- Release status: projeto Sites provisionado; a primeira versão serve apenas para validar identidade, dispatcher e origem do Worker.
- Open decisions: datas oficiais dos quatro vídeos, separação física do futuro D1 comercial/PII, política de mídia R2 e homologação dos conectores.

## Recorded Decisions

- Domínio canônico definitivo: `https://blogdocarro.com`.
- O CMS editorial será interno ao admin, com D1 como única fonte de verdade e uma interface de repositório entre domínio e persistência.
- O portal público consumirá somente uma projeção publicada; rascunhos e revisões nunca serão lidos diretamente pelas rotas públicas.
- R2 será o armazenamento futuro de mídia própria; a decisão não ativa D1, R2 ou uploads nesta fase.
- A identidade administrativa usará Sites/ChatGPT Sign in with ChatGPT (SIWC), com bootstrap de owner exclusivamente server-side e fora do Git.
- Identidade, sessão e autorização do admin permanecerão separadas da conta de cliente; permissões administrativas serão aplicadas por RBAC no servidor.
- Pagamento futuro: Mercado Pago exclusivamente para Pix; integração real bloqueada por credenciais, webhooks, homologação e gates comerciais.
- Categorias sem artigos publicados permanecem vazias; não serão preenchidas com conteúdo gerado por IA.
- O primeiro migration D1 é local e não contém PII, autenticação de cliente, pedidos, pagamentos ou envios; esses domínios exigem decisão própria antes da ativação.
- O monograma quadrado `BDC` é o símbolo reduzido oficial para favicon, atalhos e futura PWA; o logotipo horizontal permanece a assinatura principal do portal.
- Registro detalhado: `docs/adr/`.

## Stack

- App: `apps/site`, App Router compatível via Vinext, React e TypeScript estrito.
- Runtime: Vite e Cloudflare Worker empacotado para Sites.
- Database/storage: fundação D1 versionada e testada localmente para editorial, catálogo e control plane; binding D1 e R2 permanecem desativados.
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
- Símbolo reduzido e preparação PWA: `docs/specs/brand-icon-and-pwa.md`.
- Contrato de observabilidade: `docs/OBSERVABILITY.md`.
- Decisões arquiteturais: `docs/adr/`.
- Fundação D1 local: `docs/specs/d1-foundation.md`.

## Safety

- Secrets: somente variáveis de ambiente/bindings; nunca em Git ou D1.
- User data: o protótipo não deve persistir dados pessoais.
- Generated outputs: ficam nos diretórios ignorados.
- Release gates: QA aprovado, revisão visual, auditoria de dependências de produção, escopo Git conferido e autorização explícita para publicar.
