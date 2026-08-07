import type { ReactElement } from "react";
import { AdminPageHeader } from "../../admin-ui";
import { ArticleEditor } from "./article-editor";

export default function NewArticlePage(): ReactElement {
  return <><AdminPageHeader eyebrow="Editor do CMS" title="Novo artigo" description="Transforme um vídeo do canal em artigo, salve como rascunho e publique somente após confirmação humana." /><ArticleEditor /></>;
}
