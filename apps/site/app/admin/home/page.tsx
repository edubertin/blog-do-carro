import type { ReactElement } from "react";
import { AdminCard, AdminPageHeader } from "../admin-ui";
import { HomeComposer } from "./home-composer";

export default function HomeAdminPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Página inicial" title="Composição da home" description="Reordene a narrativa do portal sem tocar no código. Neste mock, a ordem vive apenas até recarregar." /><div className="adminGrid adminGrid--split"><HomeComposer /><AdminCard title="Regras do destaque" eyebrow="Hero + vídeos"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Entrada automática</strong><p>Vídeo novo cria rascunho, nunca publicação.</p></div><div className="adminTimelineItem"><strong>Enquadramento editorial</strong><p>Frame otimizado e recorte mobile aprovados por uma pessoa.</p></div><div className="adminTimelineItem"><strong>Carrossel limitado</strong><p>Quatro itens, ordem definida pela curadoria e fallback estático.</p></div></div></AdminCard></div></>;
}
