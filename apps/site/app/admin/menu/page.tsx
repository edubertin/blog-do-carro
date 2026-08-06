import type { ReactElement } from "react";
import { categories } from "@/app/lib/content";
import { AdminCard, AdminPageHeader } from "../admin-ui";
import { MenuComposer } from "./menu-composer";

export default function MenuAdminPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Navegação" title="Menu e categorias" description="Controle o que aparece para o leitor sem misturar a taxonomia editorial com rotas técnicas." /><div className="adminGrid adminGrid--split"><MenuComposer /><AdminCard title="Categorias do portal" eyebrow="Taxonomia atual"><div className="adminObjectList">{categories.map((category) => <article className="adminObjectRow" key={category}><div><h3>{category}</h3><p>Categoria pública</p></div><span>ativa</span></article>)}</div></AdminCard></div></>;
}
