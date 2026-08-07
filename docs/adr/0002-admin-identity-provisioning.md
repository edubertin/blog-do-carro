# ADR 0002 — Identidade administrativa gerenciada

- Status: **aceita**
- Data: **2026-08-06**

## Contexto

Duas identidades iniciais de owner já foram fornecidas fora do repositório. Seus identificadores são dados pessoais e não devem aparecer em documentação, código, fixtures ou logs.

## Decisão

- usar Sites/ChatGPT Sign in with ChatGPT (SIWC) como identidade gerenciada do admin;
- não armazenar senha administrativa no D1;
- executar o bootstrap inicial de owner exclusivamente no servidor, por provisionamento e/ou secrets do Sites fora do Git;
- manter os identificadores concretos fora do Git e do bundle do navegador;
- usar `oai-authenticated-user-id` como identificador estável e e-mail apenas no bootstrap controlado, habilitado por flag server-side explícita;
- aplicar allowlist e RBAC no servidor, com negação por padrão, antes de páginas, APIs e acesso a dados administrativos;
- manter a identidade encaminhada pelo Sites e a autorização do admin separadas da conta de cliente;
- remover acesso imediatamente quando uma identidade ou papel for retirado da configuração server-side.

O dispatcher do Sites é proprietário de `/signin-with-chatgpt`, `/signout-with-chatgpt` e `/callback`. A aplicação não implementará OAuth, não armazenará tokens do SIWC e não criará um cookie administrativo paralelo enquanto os headers autenticados da plataforma forem suficientes.

O primeiro owner nunca será criado por fallback em código. Identificadores autorizados ficam exclusivamente em configuração server-side; e-mail ou outro dado pessoal nunca será usado como autorização no navegador. O fallback por e-mail exige `ADMIN_EMAIL_BOOTSTRAP_ENABLED=1`, serve somente para capturar o identificador estável inicial e deve ser desligado antes de dados administrativos reais ou produção.

Durante esse bootstrap, `/admin/seguranca` mostra o identificador estável somente para uma sessão que já passou pelo dispatcher, pela allowlist e pelo RBAC. O valor não é registrado em log, analytics ou HTML público; depois de provisionado nos secrets do Sites, o fallback por e-mail é removido.

## Consequências

O preview local pode usar uma identidade sintética somente por HTTP em loopback. Fora dessa condição, a implementação exige SIWC, proteção server-side de `/admin/*` e `/api/admin/*`, páginas dinâmicas, revogação por allowlist/RBAC e testes negativos por identidade e permissão. A publicação permanece bloqueada até um preview real comprovar que o dispatcher remove ou substitui headers `oai-authenticated-user-*` forjados e que não existe origem direta capaz de contornar essa fronteira.

A identidade de cliente não concede acesso ao admin, e a identidade administrativa não substitui nem compartilha a sessão de cliente.
