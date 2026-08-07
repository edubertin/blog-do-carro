import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import { AdminCard, AdminPageHeader } from "../admin-ui";
import { ArticlesManager } from "./articles-manager";

function ArticleList(): ReactElement {
  return (
    <AdminCard title="Conteúdo editorial" eyebrow="Rascunhos e publicações">
      <ArticlesManager />
    </AdminCard>
  );
}

function PublishingRules(): ReactElement {
  return (
    <AdminCard title="Validação antes de publicar" eyebrow="Checklist editorial">
      <div className="adminTimeline"><div className="adminTimelineItem"><strong>Estrutura completa</strong><p>Título, subtítulo, imagem, corpo, opinião, vídeo, FAQ e relacionados.</p></div><div className="adminTimelineItem"><strong>SEO e acessibilidade</strong><p>Slug, descrição, canonical, imagem social e texto alternativo.</p></div><div className="adminTimelineItem"><strong>Revisão humana</strong><p>O editor salva o rascunho; a publicação exige uma confirmação separada.</p></div></div>
    </AdminCard>
  );
}

export default function ArticlesAdminPage(): ReactElement {
  return (
    <>
      <AdminPageHeader eyebrow="Conteúdo" title="Artigos" description="A pauta nasce do vídeo, mas o artigo recebe contexto, opinião e respostas próprias." action={<Link className="adminButton adminButton--primary" href="/admin/artigos/novo"><Plus size={18} weight="bold" />Criar artigo</Link>} />
      <div className="adminGrid adminGrid--split"><ArticleList /><PublishingRules /></div>
    </>
  );
}
