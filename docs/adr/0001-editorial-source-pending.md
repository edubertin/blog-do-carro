# ADR 0001 — CMS editorial interno com D1

- Status: **aceita**
- Data: **2026-08-06**

## Contexto

O Blog do Carro precisa transformar vídeos do YouTube em artigos, revisão, publicação e curadoria de home e menu por uma pessoa não técnica. Um CMS externo reduziria parte do esforço inicial, mas criaria uma segunda superfície administrativa e adaptações para um fluxo editorial estreito e próprio.

Manter CMS externo e D1 como fontes mutáveis criaria sincronização, conflito de versões e risco de rascunho chegar ao portal público.

## Decisão

O produto adotará um CMS interno no admin do Sites, com D1 como única fonte de verdade editorial para artigos, revisões, autores, categorias, FAQ, menus e composição da home.

- o domínio editorial acessará persistência por uma interface de repositório server-side;
- componentes React, handlers públicos e regras de negócio não consultarão D1 diretamente;
- a publicação produzirá uma projeção sanitizada e otimizada somente com conteúdo publicado;
- rotas públicas consumirão essa projeção e nunca a coleção administrativa de rascunhos;
- R2 armazenará mídia própria no futuro; D1 guardará apenas metadados e referências dos objetos;
- D1, R2, uploads e CRUD real permanecem desativados até migrations, autenticação, política de mídia e gates de preview serem aprovados.

Não haverá CMS externo concorrente nem sincronização bidirecional editorial.

## Motivos

- uma única central mobile-first para vídeo, artigo, revisão, home e menu;
- linguagem e checklist adequados a uma pessoa editora não técnica;
- ausência de sincronização entre provedores editoriais;
- integração direta com o runtime Sites/Vinext e bindings futuros de D1 e R2;
- portabilidade preservada pela interface de repositório e por exportação versionada;
- separação inequívoca entre conteúdo administrativo e projeção publicada.

## Consequências

- a equipe assume migrations, revisão de schema, backup, exportação, observabilidade e manutenção do editor;
- preview, autosave, revisão, agendamento, histórico e rollback precisam ser implementados como capacidades do produto;
- a interface de repositório deve permitir testes sem D1 e impedir dependência do armazenamento nas superfícies públicas;
- a projeção publicada passa a ser uma fronteira obrigatória de segurança e desempenho;
- a ativação continua condicionada a prova do fluxo com uma pessoa editora não técnica.
