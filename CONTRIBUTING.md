# Contribuindo

Obrigado pelo interesse no Blog do Carro. O desenvolvimento está pausado e o repositório é mantido principalmente como demonstração e registro arquitetural.

## Antes de abrir algo

- Vulnerabilidades devem seguir [`SECURITY.md`](SECURITY.md), nunca uma issue pública.
- Perguntas devem verificar primeiro [`PROJECT.md`](PROJECT.md) e [`docs`](docs).
- Propostas amplas de produto, pagamentos ou marketplace não estão sendo priorizadas.
- Não envie conteúdo, imagens ou marcas sem autorização de uso.

## Pull Requests

Contribuições pequenas de documentação, acessibilidade, segurança ou correção reproduzível podem ser avaliadas sem garantia de prazo.

1. crie uma branch a partir de `main`;
2. mantenha o escopo pequeno e explique o motivo;
3. não inclua secrets, PII, bancos ou artefatos locais;
4. preserve TypeScript estrito e os limites de 40 linhas por função;
5. execute os gates relevantes;
6. descreva risco e rollback no Pull Request.

```bash
npm ci
npm run ci
npm run test:e2e
```

## Limites permanentes da demonstração

- não transformar o checkout em compra real;
- não ativar pagamentos, frete, Resend ou captura de dados;
- não introduzir outro provedor de hospedagem;
- não enfraquecer SIWC, RBAC, same-origin, projeção pública ou lifecycle de mídia;
- não versionar `.env`, credenciais, sessões ou dumps.

Ao participar, siga o [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) e respeite o [`NOTICE.md`](NOTICE.md).
