# ADR 0007 — Bindings Sites com ativação fail-closed

- Status: **aceita**
- Data: **2026-08-07**

## Contexto

O CMS precisa de D1 para conteúdo estruturado e R2 para mídia. Declarar um binding, porém, não deve transformar automaticamente fixtures em dados públicos nem habilitar escrita administrativa.

## Decisão

- O Sites recebe os bindings lógicos `DB` e `MEDIA` em `.openai/hosting.json`.
- Leitura pública continua nas fixtures até `CMS_PUBLIC_READ_ENABLED=1`.
- Escritas hospedadas exigem `CMS_WRITE_ENABLED=1`, autorização administrativa e origem de mesma origem.
- Upload hospedado exige também `MEDIA_UPLOAD_ENABLED=1`.
- O ID estável do Sites nunca é persistido em claro; o provisionamento hospedado exige `ADMIN_SUBJECT_HMAC_KEY` com pelo menos 32 bytes.
- No loopback, a identidade sintética pode exercitar D1/R2 locais sem liberar essas capacidades no Site publicado.
- Presença do binding significa **provisionado**, não **ativo**.

## Consequências

- Migrações podem ser homologadas sem alterar o portal público.
- Rascunhos e mídia staged não aparecem em rotas públicas.
- A publicação editorial atualiza revisão, artigo, projeção pública, categorias e auditoria no mesmo `D1.batch()`.
- Produção só recebe flags depois dos testes negativos, backup e revisão de segurança.
