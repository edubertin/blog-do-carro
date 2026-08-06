# Blog do Carro — aplicativo

Aplicativo público em App Router e TypeScript estrito, executado por Vinext, Vite e worker Cloudflare para publicação exclusiva no Sites.

## Desenvolvimento local

Use `npm ci` e `npm run dev` na raiz do workspace.

## Qualidade

```bash
npm run lint
npm run typecheck
npm run build
npm run qa
npm audit --omit=dev
```

## Compra demonstrativa

- `/loja/chaveiro-presente`: produto e quantidade.
- `/carrinho`: revisão do item.
- `/checkout`: identificação, entrega, Pix simulado e revisão.
- `/pedido/demo/[id]`: confirmação local sem cobrança ou envio.

Mercado Livre, PayPix e Meu Envio permanecem desconectados. O mock não usa APIs externas, banco ou credenciais.

## Publicação

O único destino de publicação previsto é o Sites. Vinext, Vite, o worker Cloudflare e o pacote `.openai/hosting.json` já fazem parte do build, mantendo `apps/site` como raiz do aplicativo.

D1 e R2 estão explicitamente inativos. Seus bindings só devem ser habilitados junto com schema, migrações, autorização e observabilidade da fase correspondente.

Não adicionar configuração, SDK ou documentação de publicação para provedores externos ao Sites.
