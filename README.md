# Blog do Carro

Portal automotivo mobile-first com a identidade Deu Negócio. A aplicação usa App Router e TypeScript estrito sobre Vinext, Vite e o runtime Cloudflare adotado pelo Sites.

Repositório privado: `Edubertin/blog-do-carro`.

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
npm run test:e2e
```

`ci` executa lint, TypeScript, build Vinext, testes de renderização do Worker, validação da árvore npm e auditoria das dependências de produção. `test:e2e` cobre os fluxos mobile/desktop e acessibilidade em Chromium; o workflow do GitHub executa os dois gates.

## Limites do protótipo

O fluxo do Chaveiro Presente é demonstrativo: não cobra, não cria etiqueta, não envia dados a conectores e não persiste pedidos. D1, R2, autenticação e integrações externas permanecem desativados até a próxima fase.

O plano completo está em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

O painel administrativo demonstrativo fica em `/admin` durante o desenvolvimento local. Ele não autentica, não persiste dados, não aceita credenciais e não está disponível em host público. A especificação está em [docs/specs/admin-control-plane.md](docs/specs/admin-control-plane.md).
