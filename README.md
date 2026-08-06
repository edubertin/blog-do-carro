# Blog do Carro

Portal automotivo mobile-first com a identidade Deu Negócio. A aplicação usa App Router e TypeScript estrito sobre Vinext, Vite e o runtime Cloudflare adotado pelo Sites.

Repositório planejado: `Edubertin/blog-do-carro`.

## Executar

Na raiz do workspace:

```bash
npm ci
npm run dev
```

Acesse a URL local exibida pelo Vinext no terminal.

## Verificar

```bash
npm run ci
```

`ci` executa lint, TypeScript, build Vinext, testes de renderização do Worker, validação da árvore npm e auditoria das dependências de produção.

## Limites do protótipo

O fluxo do Chaveiro Presente é demonstrativo: não cobra, não cria etiqueta, não envia dados a conectores e não persiste pedidos. D1, R2, autenticação e integrações externas permanecem desativados até a próxima fase.

O plano completo está em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
