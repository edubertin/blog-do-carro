# ADR 0009 — Audiência, Resend e fronteira de autenticação

- Status: aceito para implementação desativada
- Data: 2026-08-09

## Decisão

O Resend será o transporte compartilhado de e-mail, mas marketing e autenticação permanecem domínios independentes. Confirmações de inscrição, magic links e mensagens futuras de pedido são transacionais. Newsletter editorial e lançamento da loja são marketing com consentimentos separados.

A loja pública entra em `waitlist`; catálogo, imagens, preços e código comercial são preservados. Carrinho e checkout não ficam disponíveis enquanto `storefront_mode=waitlist`.

O D1 atual recebe tabelas segregadas de audiência porque o contrato vigente do Sites declara um único binding D1. E-mail é armazenado somente de forma cifrada, com HMAC separado para busca. As chaves existem apenas nos secrets do Sites. Nenhuma captação é ativada sem criptografia, Turnstile, Resend e flags válidas.

## Regras

- Um contato pode ter `store_launch` e `editorial_newsletter` independentemente.
- Login de cliente nunca concede consentimento de marketing.
- Descadastro de marketing nunca impede magic link ou mensagem operacional.
- D1 é o ledger oficial de consentimento; Resend é transporte e espelho operacional.
- Admin SIWC e autenticação de clientes não compartilham sessão, cookie ou tabela.
- SQL usa statements estáticos e `bind()`.
- Tokens são de uso único, expiram e entram no D1 apenas como hash.
- E-mail, token, IP e payload do provedor não entram em logs.

## Ativação e rollback

`AUDIENCE_CAPTURE_ENABLED` e `RESEND_SEND_ENABLED` permanecem desligadas até domínio, SPF, DKIM, DMARC, Turnstile, chaves criptográficas, templates e preview serem homologados. Desligar as flags fecha captação e envio sem remover catálogo, consentimentos ou evidências.
