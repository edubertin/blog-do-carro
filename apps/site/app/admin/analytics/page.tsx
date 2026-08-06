import type { ReactElement } from "react";
import { AdminCard, AdminPageHeader, MetricCard } from "../admin-ui";

const trafficSources = [
  { label: "YouTube", value: 62 },
  { label: "Busca orgânica", value: 21 },
  { label: "Direto", value: 11 },
  { label: "Redes sociais", value: 6 },
] as const;

const topContent = [
  { title: "Moto por uma Spin financiada", value: "4,8 mil leituras" },
  { title: "Spin de leilão na troca", value: "3,9 mil leituras" },
  { title: "Ônix por Versa com sinistro", value: "2,7 mil leituras" },
] as const;

function TrafficBars(): ReactElement {
  return <AdminCard title="Origem das visitas" eyebrow="Distribuição ilustrativa"><div className="adminBarList">{trafficSources.map((source) => <div key={source.label}><div className="adminBarHeader"><span>{source.label}</span><strong>{source.value}%</strong></div><div className="adminBarTrack" role="progressbar" aria-label={source.label} aria-valuenow={source.value} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${source.value}%` }} /></div></div>)}</div></AdminCard>;
}

function DeviceSplit(): ReactElement {
  return (
    <AdminCard title="Dispositivos" eyebrow="Mobile primeiro">
      <div className="adminStateGrid"><div className="adminStateCell"><span>Smartphone</span><strong>87%</strong></div><div className="adminStateCell"><span>Desktop e tablet</span><strong>13%</strong></div></div>
      <p className="adminCardLead" style={{ marginTop: 14 }}>A faixa de decisão é 360–430 px; desktop expande a mesma hierarquia, sem virar outro produto.</p>
    </AdminCard>
  );
}

function ContentRanking(): ReactElement {
  return <AdminCard title="Conteúdo que puxou a conversa" eyebrow="Ranking ilustrativo"><div className="adminObjectList">{topContent.map((item, index) => <article className="adminQueueItem" key={item.title}><span className="adminQueueIndex">0{index + 1}</span><div><h3>{item.title}</h3><p>Artigo originado de vídeo do canal</p></div><small>{item.value}</small></article>)}</div></AdminCard>;
}

function EventPolicy(): ReactElement {
  return (
    <AdminCard title="Política de dados" eyebrow="Privacidade por padrão">
      <div className="adminTimeline"><div className="adminTimelineItem"><strong>Eventos mínimos</strong><p>Página, artigo, vídeo, busca, produto e início do checkout.</p></div><div className="adminTimelineItem"><strong>Sem PII</strong><p>IP não persistido e parâmetros sensíveis descartados na borda.</p></div><div className="adminTimelineItem"><strong>Leitura agregada</strong><p>O dashboard real consulta tabelas diárias, não o tráfego público.</p></div></div>
    </AdminCard>
  );
}

export default function AnalyticsPage(): ReactElement {
  return (
    <>
      <AdminPageHeader eyebrow="Analytics" title="Sinais, não vaidade" description="Um mock de métricas para orientar pauta, distribuição e loja. Todos os números abaixo são ilustrativos." />
      <div className="adminGrid adminGrid--metrics"><MetricCard label="Visitantes" value="12,9 mil" detail="+9% no período" tone="positive" /><MetricCard label="Sessões" value="18,4 mil" detail="1,42 por visitante" /><MetricCard label="Leitura completa" value="61%" detail="artigos de vídeo" tone="brand" /><MetricCard label="Entrada na loja" value="3,1%" detail="sem compra real" tone="warning" /></div>
      <div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><TrafficBars /><DeviceSplit /></div>
      <div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><ContentRanking /><EventPolicy /></div>
    </>
  );
}
