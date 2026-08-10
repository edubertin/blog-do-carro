# Estado do projeto

## Resumo

- **Estado:** desenvolvimento pausado.
- **Data do congelamento:** 10 de agosto de 2026.
- **Site:** demonstração pública mantida pelo Sites.
- **Repositório:** preservado publicamente e não arquivado no GitHub.
- **Licença:** nenhum regime permissivo foi adicionado; todos os direitos permanecem reservados.

## Entrega preservada

O projeto encerra este ciclo com portal editorial mobile-first, CMS próprio, editor contínuo, mídia D1/R2, revisões restauráveis, painel administrativo, catálogo conceitual da Loja da Comunidade e fundação fail-closed de audiência por e-mail.

## Integrações não ativadas

- domínio definitivo `blogdocarro.com`;
- DNS e envio Resend;
- Turnstile público;
- contas de clientes e área de pedidos;
- Mercado Pago Pix;
- Meu Envio;
- loja real, estoque, pagamento e frete;
- marketplace e cadastro de anunciantes.

## Condições para retomada

1. revisar dependências, vulnerabilidades e compatibilidade do runtime;
2. revalidar Sites, D1, R2 e SIWC;
3. revisar direitos e atualidade do conteúdo demonstrativo;
4. definir responsável por privacidade, suporte e operação;
5. homologar DNS, Resend, Gmail e Outlook antes de captura pública;
6. tratar pagamentos e frete como projeto separado com webhooks e reconciliação;
7. executar `npm run ci` e `npm run test:e2e` antes de uma nova publicação.

## Evidências

- decisões arquiteturais: [`docs/adr`](docs/adr);
- plano de implementação: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md);
- auditorias: [`docs/qa`](docs/qa) e [`docs/security`](docs/security);
- política de segurança pública: [`SECURITY.md`](SECURITY.md).
