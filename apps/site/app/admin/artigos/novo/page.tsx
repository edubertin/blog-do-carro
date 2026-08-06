import type { ReactElement } from "react";
import { AdminPageHeader } from "../../admin-ui";
import { ArticleEditor } from "./article-editor";

export default function NewArticlePage(): ReactElement {
  return <><AdminPageHeader eyebrow="Editor demonstrativo" title="Novo artigo" description="Um fluxo completo para transformar um vídeo do canal em conteúdo editorial, sem salvar ou publicar dados." /><ArticleEditor /></>;
}
