import type { ReactElement } from "react";
import { AdminCard, AdminPageHeader } from "../admin-ui";
import { HomeComposer } from "./home-composer";

export default function HomeAdminPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Página inicial" title="Composição da home" description="Reordene a narrativa do portal sem tocar no código. A ordem é persistida no CMS após salvar." /><div className="adminGrid adminGrid--split"><HomeComposer /><AdminCard title="Regras do destaque" eyebrow="Hero editorial"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Entrada automática</strong><p>Artigos publicados entram no destaque do mais recente para o mais antigo.</p></div><div className="adminTimelineItem"><strong>Capa horizontal</strong><p>Use uma imagem 1600 × 900 px e confira o recorte 16:9 antes de publicar.</p></div><div className="adminTimelineItem"><strong>Carrossel limitado</strong><p>De um a quatro artigos, sempre com acesso direto ao conteúdo publicado.</p></div></div></AdminCard></div></>;
}
