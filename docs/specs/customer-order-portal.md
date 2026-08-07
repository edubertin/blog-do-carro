# Spec — Acesso por e-mail e acompanhamento de pedidos

- Status: **proposta para implementação**
- Data: **2026-08-06**
- Referência interna: fluxo passwordless e área de clientes da Plimcor

## 1. Decisão resumida

O Blog do Carro terá uma área **Meus pedidos** sem senha. A pessoa informa o e-mail usado na compra, recebe pelo Resend um link temporário de uso único, confirma o acesso e passa a consultar somente os pedidos vinculados ao e-mail verificado.

O padrão reaproveita da Plimcor a separação entre checkout convidado, identidade verificada, sessão segura e vínculo idempotente de pedidos. A diferença deliberada é a experiência: a Plimcor usa código de seis dígitos; o Blog do Carro usará magic link para evitar digitação no celular.

Esta spec não ativa e-mail, banco ou pedidos reais. A implementação deve nascer atrás de flags e só pode ser aberta ao público depois dos gates de segurança, privacidade e operação.

## 2. Objetivo

- permitir que um comprador acompanhe pagamento, preparação, envio e entrega;
- evitar senha, cadastro obrigatório e login social no primeiro corte;
- manter o checkout como convidado;
- vincular pedidos somente depois da prova de posse do e-mail;
- reutilizar a arquitetura Sites/Vinext, Worker Cloudflare e D1 já planejada;
- deixar suporte, pagamentos e logística isolados da autenticação.

## 3. Usuários

### Comprador convidado

Finaliza a compra informando um e-mail, mas não precisa criar conta ou entrar antes do pagamento.

### Cliente autenticado

Comprova acesso ao e-mail, recebe uma sessão e consulta apenas seus próprios pedidos.

### Operação

Atualiza estados de pagamento, produção e envio no painel administrativo. A autenticação administrativa continua separada da autenticação dos clientes.

## 4. Escopo da primeira entrega

- página `/entrar` para solicitar o link;
- e-mail transacional responsivo enviado pelo Resend;
- confirmação do magic link e criação da sessão;
- páginas `/meus-pedidos` e `/meus-pedidos/[orderNumber]`;
- listagem dos 20 pedidos mais recentes;
- timeline de status e código de rastreio quando disponível;
- logout;
- vínculo idempotente por e-mail normalizado e verificado;
- flags `disabled`, `preview` e `public`;
- migrations D1, testes de isolamento e runbook de ativação.

## 5. Fora do escopo

- senha, login Mercado Livre ou redes sociais;
- alteração de e-mail sem reverificação;
- cancelamento, devolução ou reembolso pelo cliente;
- chat, anexos ou fotos;
- pagamento ou criação de etiqueta dentro da área do cliente;
- edição de endereço depois da compra;
- ativação pública antes de existir persistência real de pedidos;
- exclusão automática de registros fiscais ou comerciais.

## 6. Jornada principal

1. A pessoa toca em **Meus pedidos**.
2. Informa o mesmo e-mail utilizado no checkout.
3. O sistema sempre responde com mensagem genérica: “Se o endereço puder ser utilizado, enviaremos um link de acesso.”
4. O Resend envia um link válido por cinco minutos.
5. O link abre uma confirmação segura do Blog do Carro.
6. A pessoa toca em **Entrar e ver meus pedidos**.
7. O token é consumido uma única vez e uma sessão é criada.
8. O sistema vincula de forma idempotente os pedidos ainda sem dono cujo e-mail normalizado corresponda ao e-mail verificado.
9. A pessoa vê a lista e abre os detalhes de um pedido.
10. Ao sair, a sessão é revogada e o cookie deixa de conceder acesso.

## 7. Experiência mobile-first

- campo de e-mail e CTA ficam acessíveis com uma mão;
- a confirmação mostra claramente o domínio e o tempo de validade;
- nenhum código precisa ser copiado entre aplicativos;
- a lista prioriza número do pedido, estado atual, data e valor;
- a timeline usa texto e ícone, nunca somente cor;
- erros preservam o e-mail digitado, mas nunca revelam se existem pedidos;
- links expirados oferecem **Enviar novo link** sem criar loop automático;
- todas as telas autenticadas usam `noindex`, `nofollow` e `Cache-Control: private, no-store`.

## 8. Arquitetura alvo

```text
Navegador
├── /entrar
├── /entrar/confirmar
└── /meus-pedidos/*
        │ cookie HttpOnly
        ▼
Worker Vinext / Sites
├── Better Auth + plugin magic link
├── CustomerAuthService
├── CustomerOrderService
├── ResendEmailProvider
└── rotas autenticadas
        │
        ├── D1: usuários, sessões, verificações e limites
        ├── D1: pedidos, itens, vínculos e eventos de status
        └── Resend: entrega do link
```

### Decisões técnicas

- usar Better Auth com o plugin oficial de magic link e adapter SQLite/Drizzle para D1;
- fixar a versão exata somente depois de um spike de compatibilidade com a matriz Vinext/Vite/Cloudflare vigente;
- armazenar o token de verificação somente com hash;
- consumir o token de forma atômica e rejeitar replay;
- usar UUIDs como identificadores internos e número público separado para pedidos;
- manter a autenticação do admin fora das tabelas e cookies de cliente;
- usar Resend atrás de `EmailProvider`, sem espalhar chamadas do provedor pelas rotas;
- preservar checkout, pagamento, frete e autenticação como domínios separados.
- expor somente uma allowlist mínima de endpoints Better Auth; os endpoints internos de envio não ficam públicos diretamente;
- aplicar schema exclusivamente por migrations versionadas, sem DDL durante requests;
- executar um spike confirmando D1, múltiplos `Set-Cookie`, redirects e rotas API antes do handler Vinext no Worker.

## 9. Magic link e proteção contra scanners

O link do e-mail não deve consumir o token apenas por ser pré-visualizado por um antivírus ou scanner de links. A recomendação é enviar para uma página intermediária do próprio domínio e exigir uma ação explícita antes da verificação.

- a URL inicial não carrega analytics, pixels ou assets de terceiros;
- preferir transportar o token no fragmento da URL ou em mecanismo equivalente que não o envie como `Referer`;
- a confirmação envia o token somente para a origem canônica;
- callback permitido é fixo em `/meus-pedidos`; não aceitar redirect arbitrário do cliente;
- após o consumo, redirecionar para uma URL limpa, sem token no histórico;
- token expirado, inválido ou já usado recebe a mesma resposta visual;
- teste concorrente deve provar que duas tentativas simultâneas geram no máximo uma sessão válida.

O spike técnico deve confirmar a melhor forma de fazer a confirmação intermediária com a API vigente do Better Auth sem expor o token em logs.

## 10. Sessão e cookies

- cookie `__Host-blog_do_carro_customer`;
- `HttpOnly`, `Secure` em HTTPS e `SameSite=Lax`;
- `Path=/` e sem atributo `Domain`;
- duração inicial de sete dias;
- renovação no máximo uma vez por dia;
- operações sensíveis futuras exigirão sessão recente;
- logout revoga a sessão no D1, não apenas o cookie local;
- respostas autenticadas nunca podem ser armazenadas em cache público.

## 11. Modelo de dados

### Tabelas de autenticação

| Tabela | Responsabilidade |
| --- | --- |
| `customer_auth_users` | identidade interna e e-mail normalizado/verificado |
| `customer_auth_sessions` | token de sessão, validade, usuário e metadados mínimos |
| `customer_auth_accounts` | estrutura exigida pelo adapter, sem senha habilitada |
| `customer_auth_verifications` | magic links com valor hasheado e expiração |
| `customer_auth_rate_limits` | limites internos do Better Auth |
| `customer_auth_request_limits` | limites persistentes por HMAC de e-mail e IP |

### Tabelas de pedidos

| Tabela | Responsabilidade |
| --- | --- |
| `orders` | snapshot financeiro, e-mail normalizado, estado e referências externas |
| `order_items` | snapshot de produto, quantidade e preço em centavos |
| `customer_order_links` | vínculo imutável entre pedido e cliente verificado |
| `order_status_events` | histórico auditável de mudanças exibíveis ao cliente |
| `shipments` | transportadora, serviço, rastreio e timestamps |
| `webhook_events` | deduplicação de eventos de pagamento, envio e e-mail |

### Regras do vínculo

- o checkout grava `customer_email_normalized` no servidor;
- o checkout calcula `email_lookup_hmac` com pepper fora do D1; buscas de vínculo usam esse valor indexado;
- a sessão fornece `customerId` e e-mail verificado;
- o primeiro vínculo usa `INSERT ... SELECT` somente em pedidos sem vínculo e com e-mail correspondente;
- conflito nunca troca o dono existente;
- pedidos novos de uma sessão ativa já recebem o `customerId` no servidor;
- mudança futura de e-mail não religa pedidos automaticamente;
- consultas sempre fazem `JOIN` pelo `customerId`; nunca filtram apenas pelo e-mail vindo do cliente.

## 12. Estados do pedido

### Pagamento

`pending → paid | failed | cancelled | refunded`

### Atendimento

`awaiting_payment → processing → ready_to_ship → shipped → delivered`

Saídas excepcionais: `cancelled` ou `attention_required`.

### Exibição

- o cliente vê rótulos seguros e orientados à ação;
- detalhes internos do provedor, payloads e notas administrativas não aparecem;
- toda transição gera um evento com estado anterior, estado seguinte, ator, data e nota sanitizada;
- webhooks são idempotentes e não podem regredir estados finais sem regra explícita.

## 13. Contratos HTTP

| Método e rota | Comportamento |
| --- | --- |
| `POST /api/customer-auth/request-link` | valida origem e e-mail, aplica limites e retorna sempre mensagem genérica |
| `POST /api/customer-auth/consume-link` | consome token uma vez, cria sessão e redireciona para rota fixa |
| `GET /api/customer-auth/get-session` | retorna sessão sanitizada ou `null` |
| `POST /api/customer-auth/sign-out` | revoga sessão e cookie |
| `GET /api/customer/orders` | lista até 20 pedidos do `customerId` autenticado |
| `GET /api/customer/orders/[orderNumber]` | retorna pedido próprio ou `404` |
| `POST /api/webhooks/resend` | fase operacional: valida assinatura e registra entrega/falha idempotente |

Regras comuns:

- `POST` exige mesma origem e corpo JSON pequeno;
- rotas autenticadas respondem `401` sem sessão;
- pedido inexistente e pedido de outro usuário respondem igualmente `404`;
- respostas usam `Cache-Control: private, no-store`;
- nenhuma rota aceita `customerId`, e-mail de propriedade ou callback arbitrário enviados pelo navegador.

## 14. Resend

### Envio

- remetente em subdomínio próprio verificado;
- SPF e DKIM obrigatórios; DMARC monitorado antes da abertura pública;
- HTML responsivo e alternativa em texto simples;
- assunto curto: “Seu acesso ao Blog do Carro”;
- mensagem não inclui dados do pedido, endereço, telefone ou valores;
- chave de idempotência baseada em `requestId`, nunca no e-mail;
- retries preservam a mesma chave por até 24 horas;
- falha de envio não cria sessão e não expõe detalhe do provedor ao usuário.
- o endpoint aguarda a aceitação do Resend ou persiste uma fila confiável; não afirma envio com base apenas em tarefa `waitUntil`.

### Webhooks

Webhooks de entrega são observabilidade, não autoridade de autenticação. Quando ativados:

- verificar assinatura sobre o corpo bruto;
- deduplicar pelo identificador do evento;
- observar `sent`, `delivered`, `delivery_delayed`, `failed`, `bounced` e `complained`;
- não armazenar corpo completo do e-mail;
- não usar eventos de abertura ou clique para autorizar acesso;
- permitir replay operacional seguro.

## 15. Limites e prevenção de abuso

- resposta genérica para e-mails com ou sem pedidos;
- máximo de cinco solicitações por e-mail em 15 minutos;
- intervalo mínimo de 60 segundos entre solicitações do mesmo e-mail;
- máximo de dez solicitações por IP em dez minutos;
- chaves de limite são HMAC de e-mail/IP, nunca valores crus;
- limite adicional do Better Auth permanece habilitado em D1;
- `Retry-After` em respostas `429`;
- nenhuma verificação de existência de pedido antes do envio do link;
- CAPTCHA fica reservado para abuso comprovado, não entra no primeiro corte.

## 16. Segurança e privacidade

### Must-have

- secrets somente no mecanismo de secrets do Sites;
- `BETTER_AUTH_SECRET` com no mínimo 32 caracteres e separado de pagamentos;
- origem HTTPS canônica e lista de origens confiáveis explícita;
- token hasheado, curto prazo e uso único;
- sessão revogável, cookie host-only e nenhuma credencial no cliente;
- proteção contra enumeração, replay, fixation, CSRF, IDOR e open redirect;
- logs sem token, cookie, e-mail completo, endereço ou payload de pedido;
- analytics descartam parâmetros das rotas de autenticação;
- política de privacidade informa finalidade, provedor, retenção e direitos;
- rotina de limpeza para verificações expiradas, sessões vencidas e limites antigos.

### Retenção inicial proposta

| Dado | Retenção |
| --- | --- |
| magic link | expira em 5 minutos; registro removido em até 24 horas |
| sessão | 7 dias; sessão vencida removida em rotina periódica |
| limites | janela operacional + margem máxima de 24 horas |
| eventos de e-mail | 30 dias, sem conteúdo da mensagem |
| conta | enquanto houver finalidade legítima ou até solicitação compatível |
| pedido fiscal/comercial | conforme política jurídica ainda a definir |

Exclusão da conta não pode apagar automaticamente dados cuja retenção seja legalmente obrigatória. Essa política precisa de validação jurídica antes da ativação pública.

## 17. Flags e configuração

| Variável | Valores esperados |
| --- | --- |
| `CUSTOMER_ACCOUNTS_MODE` | `disabled`, `preview`, `public` |
| `ORDER_PORTAL_MODE` | `disabled`, `read_only` |
| `BETTER_AUTH_URL` | origem HTTPS canônica |
| `BETTER_AUTH_SECRET` | secret server-side |
| `EMAIL_TRANSPORT` | `memory` local, `resend` publicado |
| `RESEND_API_KEY` | secret server-side |
| `RESEND_FROM_EMAIL` | remetente verificado |
| `RESEND_WEBHOOK_SECRET` | fase de webhooks |

O modo local `memory` só pode funcionar em loopback, com outbox de teste isolada. Nenhuma rota de preview pode revelar tokens em ambiente publicado.

`preview` é uma flag de comportamento, não um controle de acesso. O ambiente de preview também precisa de proteção de acesso própria.

## 18. Sequência de implementação

### Fase A — fundação desativada

1. criar ADR final e fixar versões compatíveis;
2. adicionar D1, Drizzle, migrations e repositórios;
3. criar `CustomerAuthService`, adapter Better Auth e `EmailProvider`;
4. implementar flags com default `disabled` fora de loopback;
5. criar testes unitários e de contrato sem enviar e-mail real.

### Fase B — portal em preview

1. implementar telas mobile-first;
2. adicionar pedido fixture e jornada E2E;
3. verificar magic link, expiração, replay, logout e isolamento;
4. validar e-mail em Gmail e Outlook;
5. revisar logs, cache, cookies e acessibilidade.

### Fase C — integração comercial

1. criar pedidos reais com snapshots imutáveis;
2. conectar eventos de pagamento e envio;
3. vincular pedidos antigos por e-mail verificado;
4. atualizar privacidade, termos e runbook;
5. ativar `public` e `read_only` gradualmente.

## 19. Critérios de aceite

- solicitar acesso não revela se o e-mail possui conta ou pedido;
- link expira em cinco minutos e só funciona uma vez;
- preview automatizado do link não cria sessão;
- duas verificações concorrentes criam no máximo uma sessão válida;
- cookie publicado é `HttpOnly`, `Secure`, `SameSite=Lax` e host-only;
- logout impede nova leitura com a sessão anterior;
- cliente A recebe `404` ao consultar o pedido do cliente B;
- vínculo por e-mail é idempotente e nunca muda o dono existente;
- lista exibe no máximo 20 pedidos, sempre do usuário autenticado;
- status exibido corresponde ao último evento permitido;
- nenhuma tela ou log contém token, cookie ou payload sensível;
- Resend recebe chave de idempotência sem PII;
- e-mail tem HTML e texto simples e passa em dois provedores;
- `npm run ci`, testes E2E e auditoria de acessibilidade passam;
- rollback para `disabled` remove o acesso sem apagar evidências.

## 20. Casos de teste obrigatórios

### Autenticação

- e-mail válido, inválido, normalizado e muito longo;
- resposta indistinguível para e-mail com e sem pedidos;
- expiração, replay, token alterado e consumo concorrente;
- callback externo rejeitado;
- requisição de outra origem rejeitada;
- limites por e-mail e IP persistem entre instâncias;
- sessão vence, renova conforme regra e é revogada no logout.

### Autorização

- lista sem sessão retorna `401`;
- pedido próprio retorna `200`;
- pedido alheio e inexistente retornam o mesmo `404`;
- alterar `orderNumber`, e-mail ou `customerId` no cliente não amplia acesso;
- pedido já vinculado não é apropriado por outro usuário.
- não existe consulta pública permanente por bearer token como alternativa ao portal autenticado;

### E-mail e operação

- retry com a mesma chave não duplica envio;
- falha e timeout do Resend geram log sanitizado;
- assinatura de webhook inválida é rejeitada;
- webhook duplicado é idempotente;
- HTML, texto simples, contraste e leitura mobile aprovados;
- parâmetros de autenticação não chegam ao analytics ou `Referer`.

## 21. Rollback

1. definir `CUSTOMER_ACCOUNTS_MODE=disabled`;
2. definir `ORDER_PORTAL_MODE=disabled`;
3. preservar usuários, sessões, vínculos e eventos para auditoria;
4. não alterar pagamento, frete ou checkout durante o rollback;
5. corrigir em preview e reativar primeiro com portal somente leitura.

## 22. Dependências e decisões pendentes

- subdomínio de envio transacional;
- modelo definitivo de pedidos e homologação do Mercado Pago exclusivamente para Pix;
- transportadora e origem do rastreio;
- política jurídica de retenção, exclusão, troca e reembolso;
- compatibilidade da versão vigente do Better Auth com Vinext e D1;
- estratégia definitiva contra scanners de link;
- processo de suporte quando o comprador perde acesso ao e-mail.

## 23. Referências técnicas

- [Better Auth — Magic Link](https://better-auth.com/docs/plugins/magic-link)
- [Better Auth — Banco e schema](https://better-auth.com/docs/concepts/database)
- [Better Auth — Adapter Drizzle](https://better-auth.com/docs/adapters/drizzle)
- [Resend — Chaves de idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend — Domínios, SPF e DKIM](https://resend.com/docs/dashboard/domains/introduction)
- [Resend — DMARC](https://resend.com/docs/dashboard/domains/dmarc)
- [Resend — Webhooks](https://resend.com/docs/webhooks/introduction)
