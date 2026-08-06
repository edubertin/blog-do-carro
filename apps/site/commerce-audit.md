# Auditoria do fluxo demonstrativo de compra

## Veredito

Saudável para validação local. O fluxo completo funciona em navegador real, não produz overflow horizontal entre 320 e 1440 px e não chama serviços externos.

## Etapas auditadas

1. **Produto — saudável**
   - Preço ilustrativo, quantidade, aviso de simulação e CTA aparecem na mesma página.
   - Evidência: `output/playwright/checkout-audit/03-after-product-390.png`.

2. **Carrinho — saudável**
   - Quantidade, remoção, subtotal e próximo passo são compreensíveis.
   - O contador da navegação acompanha o item.
   - Evidência: `output/playwright/checkout-audit/10-final-cart-390.png`.

3. **Identificação — saudável**
   - Checkout como convidado, labels permanentes e consentimento explícito.
   - Login Mercado Livre aparece apenas como integração não conectada.
   - Evidência: `output/playwright/checkout-audit/15-final-identity-390.png`.

4. **Endereço e frete — saudável**
   - Preenchimento fictício evita pedir dados reais durante a avaliação.
   - Frete econômico e expresso atualizam o resumo em centavos.
   - Meu Envio permanece desconectado.
   - Evidência: `output/playwright/checkout-audit/14-final-delivery-390.png`.

5. **Pix demonstrativo — saudável**
   - Não há QR Code, código copiável ou botão “Pagar”.
   - PayPix permanece desconectado e sem chamada de rede.
   - Evidência: `output/playwright/checkout-audit/11-final-payment-390.png`.

6. **Revisão — saudável**
   - Dados, entrega e pagamento podem ser revisados antes da conclusão.
   - Consentimento final é obrigatório.
   - Evidência: `output/playwright/checkout-audit/12-final-review-390.png`.

7. **Confirmação — saudável**
   - A interface usa “simulação concluída” e repete que não houve cobrança ou entrega.
   - A referência `DEMO-CHP-*` funciona somente na aba atual.
   - Evidência: `output/playwright/checkout-audit/13-final-confirmation-390.png`.

## Segurança e privacidade verificadas

- `localStorage`: apenas `blog-do-carro-cart-v1`, com produto e quantidade.
- `sessionStorage`: apenas `blog-do-carro-demo-order-v1`, sem dados pessoais.
- Nome, e-mail, telefone e endereço usados no teste não apareceram nos storages.
- Nenhum host externo foi solicitado durante o fluxo.
- Console da build de produção: zero erros e zero avisos.

## Responsividade

As larguras de `body`, documento e viewport coincidiram em 320, 390, 430, 768 e 1440 px. A navegação editorial inferior fica oculta durante carrinho, checkout e confirmação para não cobrir ações comerciais.

## Limites

- Screenshots e DOM não comprovam compatibilidade completa com leitores de tela.
- Não existem testes reais de gateway, frete, autenticação, banco ou webhook porque essas integrações permanecem desligadas.
- Preço, prazo e frete são dados ilustrativos e precisam de homologação antes da venda real.
