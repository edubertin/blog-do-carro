import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import { adminArticles } from "../admin-data";
import { AdminCard, AdminPageHeader } from "../admin-ui";

function ArticleList(): ReactElement {
  return (
    <AdminCard title="Conteúdo editorial" eyebrow="4 itens ilustrativos">
      <div className="adminObjectList">{adminArticles.map((article) => <article className="adminObjectRow" key={article.title}><div><h3>{article.title}</h3><p>{article.category} · Origem: {article.source} · {article.updated}</p></div><div className="adminRowActions"><span className="adminStatus"><i aria-hidden="true" />{article.status}</span><Link className="adminTextLink" href={`/admin/artigos/novo?source=${encodeURIComponent(article.title)}`}>Editar mock</Link></div></article>)}</div>
    </AdminCard>
  );
}

function PublishingRules(): ReactElement {
  return (
    <AdminCard title="Validação antes de publicar" eyebrow="Checklist futuro">
      <div className="adminTimeline"><div className="adminTimelineItem"><strong>Estrutura completa</strong><p>Título, subtítulo, imagem, corpo, opinião, vídeo, FAQ e relacionados.</p></div><div className="adminTimelineItem"><strong>SEO e acessibilidade</strong><p>Slug, descrição, canonical, imagem social e texto alternativo.</p></div><div className="adminTimelineItem"><strong>Revisão humana</strong><p>Editor prepara; publicador confirma. O mock não altera o portal.</p></div></div>
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
