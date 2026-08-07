# Auditoria sistêmica de artigos — 2026-08-07

## Veredito

O fluxo editorial está funcional e coerente no código para criar, reabrir, revisar, publicar e arquivar artigos. A publicação em produção ainda depende de validação integrada contra um D1 efêmero/preview real e do endurecimento do RBAC persistido do painel.

## Corrigido neste corte

- O editor abre vazio, sem conteúdo de demonstração e sem checklist lateral redundante.
- Campos, limites, categorias, descrições e validações cliente/servidor foram alinhados.
- URL/ID do YouTube passou a ser obrigatório e validado para domínios e formatos aceitos.
- Imagens aceitam somente caminho público seguro ou HTTPS sem credenciais.
- Erros esperados agora usam status `404`, `409` ou `422`; falhas inesperadas usam `500` sanitizado.
- Criação e revisão deixaram de ser inferidas pelo slug. Revisões usam `articleId`; colisões retornam `409`.
- O botão **Editar artigo** carrega a revisão atual pelo ID e preenche o formulário.
- Depois de salvar, o editor permite corrigir e salvar uma nova revisão.
- Publicação direta de rascunho foi bloqueada. O fluxo exige **Enviar para revisão** antes de **Publicar artigo**.
- Publicações repetidas são rejeitadas pela máquina de estado e a primeira data pública é preservada.
- Arquivamento remove a projeção pública e preserva revisões e auditoria.
- Estados administrativos são exibidos em português e o botão textual de remoção não é mais comprimido pelo CSS de ícones.
- Mensagens portuguesas corrompidas por codificação foram corrigidas na fronteira administrativa examinada.

## Evidência executada

- `npm run qa`: lint, TypeScript, build, 8 testes de fundação D1 e 47 testes renderizados aprovados.
- `npm run test:e2e`: 20 testes Playwright aprovados em mobile e desktop.
- Casos editoriais cobertos no navegador: formulário vazio, acessibilidade crítica, imagem, criação de rascunho, revisão, publicação, reabertura por ID e arquivamento.
- `git diff --check`: sem erros de whitespace.

## Estrutura atual

```text
Admin UI
  /admin/artigos
  /admin/artigos/novo?article=:id
       |
Admin API protegida
  GET/POST /api/admin/articles
  GET/DELETE /api/admin/articles/:id
  POST /api/admin/articles/:id/review
  POST /api/admin/articles/:id/publish
       |
Repositório editorial D1
  articles + article_revisions + FAQ + categorias + vídeo
       |
Projeção pública isolada
  published_article_projections + published_article_categories
```

## Pendências para declarar produção completa

1. Executar o ciclo HTTP real contra D1 efêmero/preview com migrations e seed, sem interceptar as APIs no Playwright.
2. Fazer a API consultar papéis ativos no D1 em cada requisição; hoje a identidade encaminhada pelo Sites ainda chega com papel resolvido antes dessa consulta.
3. Adicionar bloqueio otimista por versão e chave de idempotência para concorrência entre duas abas ou retries de rede.
4. Registrar também tentativas negadas e falhas sanitizadas na auditoria, não somente operações concluídas.
5. Implementar autor, artigos relacionados, múltiplos FAQs, preview e agendamento antes de afirmar conformidade com todo o modelo editorial alvo.
6. Adicionar autosave/proteção contra saída com alterações não salvas.

## Limites deste corte

Nenhuma migration destrutiva, alteração de secrets, publicação, commit, push ou remoção de artigo real foi executada.
