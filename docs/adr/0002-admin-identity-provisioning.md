# ADR 0002 — Identidade administrativa gerenciada

- Status: **aceita**
- Data: **2026-08-06**

## Contexto

Duas identidades iniciais de owner já foram fornecidas fora do repositório. Seus identificadores são dados pessoais e não devem aparecer em documentação, código, fixtures ou logs.

## Decisão

- usar um provedor de identidade gerenciada para o admin;
- não armazenar senha administrativa no D1;
- provisionar as duas identidades de owner no provedor e/ou no mecanismo server-side de secrets do Sites;
- manter os identificadores concretos fora do Git e do bundle do navegador;
- mapear no aplicativo apenas o subject opaco validado e o papel autorizado;
- revogar sessões quando uma identidade ou papel for removido.

O provedor definitivo e o contrato técnico de integração ainda precisam de spike e ADR complementar. O primeiro owner nunca será criado por fallback em código.

## Consequências

O mock continua sem login. A implementação real precisa validar issuer, audience, origem, sessão e RBAC antes do handler Vinext, com cookie administrativo separado da conta do cliente.
