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

O fluxo do Chaveiro Presente é demonstrativo: não cobra, não cria etiqueta, não envia dados a conectores e não persiste pedidos. D1, R2, autenticação de cliente e integrações externas permanecem desativados até a próxima fase.

O plano completo está em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

O painel administrativo demonstrativo fica em `/admin`. Em loopback ele usa uma identidade de prévia; em host publicado exige Sites/ChatGPT SIWC e owner configurado exclusivamente no servidor. O painel ainda não persiste dados nem aceita credenciais. A especificação está em [docs/specs/admin-control-plane.md](docs/specs/admin-control-plane.md).

O símbolo quadrado `BDC` está definido como ícone oficial do site e base da futura PWA. A separação entre símbolo compacto e logotipo horizontal, além dos gates para instalação e cache offline, está em [docs/specs/brand-icon-and-pwa.md](docs/specs/brand-icon-and-pwa.md).
