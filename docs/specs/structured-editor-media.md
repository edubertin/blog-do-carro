# Spec — Editor estruturado e mídia editorial

- Status: **aprovada para implementação e homologação**
- Data: **2026-08-08**

## Objetivo

Permitir que uma pessoa insira imagens entre trechos do artigo com uma experiência simples, mobile-first e semelhante à inserção por blocos do WordPress, sem armazenar HTML livre e sem expor mídia privada.

## Documento de conteúdo v1

O corpo é um documento versionado com blocos discriminados:

```ts
type ArticleContentDocument = Readonly<{
  schemaVersion: 1;
  blocks: readonly ArticleBlock[];
}>;

type ArticleBlock = ParagraphBlock | HeadingBlock | ImageBlock;
```

- `paragraph`: texto corrido;
- `heading`: subtítulo de nível H2 ou H3;
- `image`: referência por `mediaAssetId`, apresentação, texto alternativo e legenda opcional.

HTML livre, scripts, URLs administrativas e código arbitrário são rejeitados. Artigos legados em `string[]` são convertidos em memória para blocos de parágrafo; não exigem migração imediata.

## Experiência do editor

- Pontos de inserção antes, entre e depois dos blocos adicionam texto, subtítulo ou imagem na posição escolhida.
- No celular, os controles permanecem no fluxo do artigo e aceitam câmera, galeria ou arquivo pelo seletor nativo.
- Durante o upload, movimentação e salvamento ficam bloqueados para preservar a posição e impedir revisões incompletas.
- Imagem inserida pode ser substituída, movida, legendada ou removida do artigo.
- Texto alternativo é obrigatório; legenda é opcional.
- Mover para cima/baixo funciona por toque e teclado; drag-and-drop é apenas conveniência futura.
- O primeiro corte usa salvamento explícito com indicação de alterações não salvas.
- Falha de upload nunca descarta texto ou outros blocos.

## Vínculo por revisão

Mídia pertence ao uso em uma revisão, não diretamente à identidade permanente do artigo:

```text
article_revision_media
- revision_id
- media_asset_id
- usage: cover | inline
- block_id
- position
- alt_text
- caption
```

O texto alternativo e a legenda pertencem ao contexto editorial daquela revisão. Remover um bloco desfaz o vínculo, mas não apaga imediatamente o objeto.

## Ciclo da mídia

```text
upload → staged → vínculo à revisão → revisão → published → archived
```

- `staged`: preview privado do admin; rota pública retorna 404.
- `published`: utilizada por uma projeção publicada e disponível em rota pública estável.
- `archived`: fora de uso público e sujeita à política de retenção.

Objetos no R2 são imutáveis. Publicar altera estado e vínculos no D1, sem mover o objeto. Chaves não contêm e-mail, nome ou outro dado pessoal.

## Validação e entrega

- aceitar inicialmente JPEG, PNG e WebP;
- limite inicial de 5 MB, dimensões e total de pixels limitados;
- validar assinatura e decodificação real, rejeitando arquivo truncado ou MIME falso;
- rejeitar SVG e GIF no primeiro corte;
- corrigir orientação e remover EXIF/GPS;
- gerar variantes responsivas com dimensões explícitas;
- servir apenas `published`, com tipo correto, ETag, cache e `nosniff`;
- impedir publicação enquanto qualquer upload estiver pendente ou falho.

## Publicação lógica

Antes de publicar, o servidor valida o documento, confirma cada asset, grava os vínculos da revisão, atualiza a projeção pública, promove mídias utilizadas e registra auditoria. Uma falha preserva integralmente a projeção pública anterior.

D1 e R2 não oferecem uma transação distribuída. Por isso, objetos são gravados antes como `staged`; o commit editorial ocorre no D1 e uma rotina idempotente reconcilia estados. Publicação repetida não duplica vínculos nem objetos.

## Homologação

Executar primeiro em ambiente controlado com a entrega pública de mídia desligada:

- capa e imagens entre parágrafos em 360, 390/412, 430 px e desktop;
- salvar, reabrir, substituir, mover, remover, revisar e publicar;
- formatos válidos e inválidos, limite de tamanho, MIME falso e arquivo truncado;
- `staged` inacessível anonimamente e `published` acessível;
- teclado, foco, toque, leitor de tela e ausência de overflow;
- falha em cada etapa preservando a versão pública anterior;
- reconciliação D1/R2 e limpeza conservadora de órfãos.

## Rollback

- Desligar novos uploads não remove imagens já publicadas.
- Desligar o renderer de blocos usa a projeção pública anterior, sem regravar revisões.
- Reverter uma publicação reponta o artigo para a revisão publicada anterior e reconcilia os estados de mídia.
- Nenhuma limpeza destrutiva ocorre durante rollback; objetos sem vínculo entram em retenção antes de arquivamento ou exclusão.

## Critérios de aceite

- inserir imagem entre dois parágrafos pelo celular;
- preservar posição e metadados após salvar e reabrir;
- artigos legados continuam legíveis;
- mídia `staged` nunca aparece publicamente;
- publicação falha sem retirar do ar a revisão anterior;
- preview e página pública usam o mesmo renderer seguro;
- desligar uploads não quebra imagens já publicadas.
