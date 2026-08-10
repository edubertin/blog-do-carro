# Audiência e infraestrutura de e-mail

## Escopo

- Loja preservada em pré-lançamento.
- Interesse por produto e newsletter com e-mail como único dado digitado.
- Consentimentos específicos, desmarcados e versionados.
- Double opt-in com página intermediária e token no fragmento da URL.
- D1 com contato cifrado, lookup HMAC, assinatura, token e ledger.
- Turnstile validado no servidor.
- Resend atrás de `EmailProvider` e desligado por padrão.
- `/admin/audiencia` com contagens separadas, sem revelar PII.

## Fora do escopo

- Campanhas e broadcasts reais.
- Exportação ou revelação de e-mails.
- Portal público de pedidos.
- Pagamento, frete, estoque real ou pedido persistente.
- Configuração de secrets pelo painel.

## Fluxos

`Avise-me no lançamento` envia `store_launch` com o produto de origem. `Quero receber os artigos` envia `editorial_newsletter`. Uma inscrição não altera a outra. O servidor responde genericamente, envia um link com validade de 24 horas e exige clique explícito em `/confirmar-inscricao`.

## Configuração obrigatória

- `AUDIENCE_CAPTURE_ENABLED`
- `AUDIENCE_ENCRYPTION_KEY`
- `AUDIENCE_LOOKUP_HMAC_KEY`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_SEND_ENABLED`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Os valores nunca chegam ao painel, Git ou D1.

## Gates

1. Migration aplicada em preview.
2. Domínio, SPF, DKIM e DMARC verificados.
3. Turnstile e limites de abuso testados.
4. Gmail e Outlook aprovados.
5. Novo, duplicado, expiração e replay testados.
6. Mobile 360–430 px, teclado e Axe aprovados.
7. Política de privacidade publicada.
8. Flags ligadas primeiro em preview.

## Autenticação de clientes

O `EmailProvider` será reutilizado pelo Better Auth após o spike Vinext/Worker/D1. Magic links usarão o fluxo transacional, sem Topics de marketing. `CUSTOMER_ACCOUNTS_MODE` permanece `disabled` até existirem pedidos reais.

## Templates e preview

Um shell visual reutilizável gera três mensagens independentes: confirmação editorial, confirmação de interesse na loja e magic link do cliente. Os templates retornam HTML compatível com clientes de e-mail e alternativa em texto simples. A galeria protegida `/admin/emails` usa fixtures e nunca chama o Resend.

O checklist operacional e o ponto exato de retomada do DNS ficam em `docs/RESEND_SETUP_CHECKLIST.md`. O envio permanece pausado até a homologação em Gmail e Outlook.
