import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import { adminArticles, adminConnectors, dashboardMetrics, demoOrders } from "./admin-data";
import { AdminCard, AdminPageHeader, AdminTextLink, MetricCard, StatusPill } from "./admin-ui";

function EditorialQueue(): ReactElement {
  return (
    <AdminCard title="Fila editorial" eyebrow="Conteúdo">
      <div className="adminObjectList">{adminArticles.slice(0, 3).map((article) => <article className="adminObjectRow" key={article.title}><div><h3>{article.title}</h3><p>{article.category} · {article.source}</p></div><span>{article.status}<br />{article.updated}</span></article>)}</div>
      <AdminTextLink href="/admin/artigos">Ver todos os artigos</AdminTextLink>
    </AdminCard>
  );
}

function OrderSnapshot(): ReactElement {
  return (
    <AdminCard title="Jornada da loja" eyebrow="Somente fixtures">
      <div className="adminObjectList">{demoOrders.slice(0, 2).map((order) => <article className="adminObjectRow" key={order.id}><div><h3>{order.id}</h3><p>{order.status} · {order.shipping}</p></div><span>{order.total}<br />{order.createdAt}</span></article>)}</div>
      <AdminTextLink href="/admin/pedidos">Abrir pedidos demo</AdminTextLink>
    </AdminCard>
  );
}

function ConnectorSnapshot(): ReactElement {
  return (
    <AdminCard title="Saúde das conexões" eyebrow="Control plane futuro">
      <div className="adminObjectList">{adminConnectors.slice(0, 4).map((connector) => <article className="adminObjectRow" key={connector.id}><div><h3>{connector.name}</h3><p>{connector.area}</p></div><StatusPill status={connector.status} /></article>)}</div>
      <AdminTextLink href="/admin/integracoes">Revisar todas as conexões</AdminTextLink>
    </AdminCard>
  );
}

function ActivationGates(): ReactElement {
  return (
    <AdminCard title="Antes de ativar" eyebrow="Gates obrigatórios">
      <div className="adminTimeline">
        <div className="adminTimelineItem"><strong>Identidade administrativa</strong><p>Autenticação e autorização no servidor, separadas da conta do cliente.</p></div>
        <div className="adminTimelineItem"><strong>Dados e auditoria</strong><p>D1, migrations, RBAC e log append-only aprovados em preview.</p></div>
        <div className="adminTimelineItem"><strong>Conectores homologados</strong><p>Secrets no Sites, saúde válida, flag server-side e rollback definido.</p></div>
      </div>
    </AdminCard>
  );
}

export default function AdminDashboardPage(): ReactElement {
  return (
    <>
      <AdminPageHeader eyebrow="Central operacional" title="Hoje na garagem" description="Uma visão curta do conteúdo, da comunidade e dos sistemas que vão sustentar o portal." action={<Link className="adminButton adminButton--primary" href="/admin/artigos/novo"><Plus size={18} weight="bold" />Novo artigo</Link>} />
      <div className="adminGrid adminGrid--metrics">{dashboardMetrics.map((metric) => <MetricCard label={metric.label} value={metric.value} detail={metric.delta} tone={metric.tone} key={metric.label} />)}</div>
      <div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><EditorialQueue /><OrderSnapshot /></div>
      <div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><ConnectorSnapshot /><ActivationGates /></div>
    </>
  );
}
