# ADR 0003 — Domínio canônico

- Status: **aceita**
- Data: **2026-08-06**

## Decisão

O domínio canônico definitivo do produto é `https://blogdocarro.com`.

- canonicals, sitemap, Open Graph e URLs públicas usam essa origem;
- callbacks futuros de identidade, e-mail e pagamentos usam allowlist explícita dessa origem;
- previews mantêm origens próprias e nunca se tornam canonical;
- variantes como `www` devem redirecionar permanentemente para o domínio canônico quando a publicação for autorizada;
- nenhuma callback sensível é derivada de um header `Host` não confiável.

## Consequências

Esta decisão não autoriza DNS ou deploy. Mudança futura de domínio exigirá novo ADR e plano de redirects, cookies e callbacks.
