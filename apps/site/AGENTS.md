# Regras locais — site

Leia primeiro `../../AGENTS.md`, `../../PROJECT.md` e `../../docs/IMPLEMENTATION_PLAN.md`.

## Runtime

- O aplicativo usa App Router por meio do Vinext, com Vite e worker Cloudflare.
- Não adicione `next` como dependência direta nem configuração de publicação da Vercel.
- Preserve `.openai/hosting.json` e qualquer `project_id` que o Sites adicionar.
- O código-fonte do plugin do Sites em `build/` deve permanecer versionado.

## Produto

- O público é majoritariamente mobile; valide primeiro em 360–430 px.
- Loja e checkout são demonstrações sem cobrança, pedido persistente ou envio.
- D1, R2, Mercado Livre, PayPix e Meu Envio permanecem desativados até uma fase explicitamente aprovada.

## Qualidade

- TypeScript estrito, sem `any` e sem erros silenciados.
- Rode `npm run qa` na raiz após mudanças funcionais.
- Use Playwright para fluxos e regressões visuais quando a tarefa envolver UI.
