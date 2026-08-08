# Mock de compra — Loja da comunidade

## Objetivo

Validar a experiência completa de compra do chaveiro e da miniatura Blog do Carro antes de conectar autenticação, pagamento, logística ou persistência de pedidos.

O fluxo é deliberadamente demonstrativo. Nenhuma tela pode criar cobrança, etiqueta, rastreio, pedido persistente ou envio.

## Fluxo implementado

1. Produto com preço ilustrativo e quantidade de uma a cinco unidades.
2. Carrinho com alteração de quantidade, remoção e subtotal.
3. Identificação como convidado.
4. Endereço manual ou preenchimento fictício e duas opções locais de frete.
5. Pix demonstrativo sem QR Code, código copiável ou CTA de pagamento.
6. Revisão obrigatória antes da conclusão.
7. Confirmação com referência `DEMO-CHP-*`, sem linguagem de pedido pago.

## Padrões reaproveitados da Plimcor

- Catálogo tipado como fonte única de preço em centavos.
- `CartProvider` versionado com parser partindo de `unknown`.
- Carrinho persistido em `localStorage` somente com produto e quantidade.
- Rotas separadas para produto, carrinho, checkout e confirmação.
- Páginas de carrinho e checkout com `noindex, nofollow`.
- Estado de pagamento expresso por fase, sem confiar na interface para calcular valores.

## Privacidade do mock

- Nome, e-mail, telefone e endereço permanecem apenas no estado React da página.
- Nenhum dado pessoal é gravado em `localStorage` ou `sessionStorage`.
- A confirmação salva somente referência demo, quantidade, frete, data e status de simulação.
- Recarregar o checkout remove os dados pessoais e reinicia a primeira etapa.

## Integrações paradas

As flags ficam em `app/commerce/integration-config.ts` e permanecem `false`:

- Login Mercado Livre.
- Mercado Pago Pix.
- Meu Envio.
- Pedidos persistentes.

Não existem SDKs, rotas de API, credenciais, webhooks, banco ou chamadas externas para esses serviços.

## Fronteiras da implementação real

Quando a fase real for aprovada, cada integração deve entrar atrás de um adaptador próprio:

- `IdentityProvider`: login e sessão.
- `ShippingProvider`: cotação, etiqueta e rastreio.
- `PaymentProvider`: criação e conciliação do Pix.
- `OrderRepository`: persistência idempotente do pedido.
- `CommerceAdmin`: acompanhamento e exceções operacionais.

O front-end não deve conhecer tokens, payloads de webhook ou regras internas dos provedores.

## Refatorações recomendadas

1. Separar a busca editorial do componente cliente de navegação para reduzir o bundle.
2. Remover `ProductInterestForm` quando a captação de interesse ganhar uma rota ou campanha própria.
3. Revisar `allowJs` e `skipLibCheck` no `tsconfig.json` antes da integração real.
4. Adicionar testes unitários para parser do carrinho, cálculo em centavos e snapshots demo.
5. Criar testes de contrato somente quando os adaptadores reais forem definidos.

## Gate para implementação real

- Produto físico, preço, estoque e embalagem homologados.
- Políticas de privacidade, troca, reembolso e entrega publicadas.
- Ambientes sandbox dos provedores disponíveis sem segredos no código.
- Idempotência, reconciliação, assinatura de webhook e estados de falha especificados.
- Observabilidade, suporte operacional e rollback definidos.
- Aprovação explícita antes de qualquer cobrança ou armazenamento de dados reais.
