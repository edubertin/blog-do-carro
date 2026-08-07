# ADR 0004 — Mercado Pago somente para Pix

- Status: **aceita, implementação bloqueada**
- Data: **2026-08-06**

## Contexto

O roadmap alternava entre PayPix e Mercado Pago, inclusive citando cartão. Isso impediria um contrato único de pagamento e ampliaria prematuramente o escopo comercial.

## Decisão

- o único destino de pagamento planejado é Mercado Pago;
- o primeiro corte aceita exclusivamente Pix; cartão e outros meios ficam fora do escopo;
- PayPix deixa de ser destino arquitetural e de roadmap;
- criação de pagamento ocorre somente no servidor, com valor recalculado a partir do pedido;
- toda criação usa chave de idempotência e referência interna do pedido;
- webhook é assinado, deduplicado e reconciliado antes de alterar o estado financeiro.

A integração real permanece bloqueada até existirem credenciais separadas de teste e produção, secret de webhook no Sites, conta e chave Pix homologadas, endpoint público seguro, testes de replay e runbook de reconciliação. Nenhuma credencial entra no painel ou no D1.

## Referências oficiais

- [Mercado Pago — Pix no Checkout Transparente/API Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/pix)
- [Mercado Pago — credenciais](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/resources/credentials)
- [Mercado Pago — Webhooks e validação de origem](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

## Consequências

O mock continua sem QR Code ou cobrança. Catálogo, pedido persistente, políticas, suporte e operação precisam estar aprovados antes de qualquer sandbox ou produção.
