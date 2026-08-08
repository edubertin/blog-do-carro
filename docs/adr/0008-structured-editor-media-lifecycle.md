# ADR 0008 — Editor em blocos e mídia por revisão

- Status: **aceita**
- Data: **2026-08-08**

## Contexto

O corpo atual baseado em parágrafos não representa imagens entre trechos. O upload R2 existente cria mídia staged, mas não define vínculo editorial, entrega pública ou rollback seguro.

## Decisão

- O conteúdo v1 é um documento versionado com blocos `paragraph`, `heading` e `image`.
- Artigos legados são adaptados em leitura; nenhuma migração destrutiva é exigida.
- Imagens são referenciadas por ID e vinculadas à revisão com uso, posição, texto alternativo e legenda.
- O ciclo de mídia é `staged | published | archived`.
- Objetos R2 são imutáveis; D1 controla visibilidade e vínculos.
- HTML livre e URLs administrativas não fazem parte do documento.
- A publicação preserva a projeção pública anterior diante de qualquer falha.
- Upload e entrega pública continuam atrás de gates server-side independentes.

## Consequências

- Uma imagem pode aparecer no meio do artigo sem ampliar a superfície de XSS.
- A mesma mídia pode ter contexto acessível diferente por revisão.
- D1 e R2 exigem reconciliação idempotente, pois não compartilham uma transação distribuída.
- Remoção do artigo não implica exclusão imediata do objeto.
- O primeiro corte limita tipos de bloco para reduzir risco e acelerar homologação.

Detalhes operacionais e critérios de aceite estão em `docs/specs/structured-editor-media.md`.
