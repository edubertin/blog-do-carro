"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { demoOrders } from "../admin-data";
import { AdminCard, AdminPageHeader, MetricCard } from "../admin-ui";
import { MockAction } from "../mock-action";

type DemoOrder = (typeof demoOrders)[number];

function OrdersList({ selectedId, onSelect }: Readonly<{ selectedId: string; onSelect: (order: DemoOrder) => void }>): ReactElement {
  return <AdminCard title="Pedidos demonstrativos" eyebrow="Sem clientes ou PII"><div className="adminObjectList">{demoOrders.map((order) => <button className={`adminObjectRow adminObjectRow--button ${selectedId === order.id ? "isSelected" : ""}`} type="button" aria-pressed={selectedId === order.id} onClick={() => onSelect(order)} key={order.id}><div><h3>{order.id}</h3><p>{order.status} · {order.shipping} · {order.createdAt}</p></div><span>{order.total}</span></button>)}</div></AdminCard>;
}

function OrderDetail({ order }: Readonly<{ order: DemoOrder }>): ReactElement {
  return (
    <AdminCard title={order.id} eyebrow="Detalhe ilustrativo"><div className="adminStateGrid"><div className="adminStateCell"><span>Pagamento</span><strong>{order.status}</strong></div><div className="adminStateCell"><span>Frete</span><strong>{order.shipping}</strong></div><div className="adminStateCell"><span>Total</span><strong>{order.total}</strong></div><div className="adminStateCell"><span>Cliente</span><strong>não armazenado</strong></div></div><div className="adminTimeline" style={{ marginTop: 18 }}><div className="adminTimelineItem"><strong>Carrinho revisado</strong><p>1 × Chaveiro Presente.</p></div><div className="adminTimelineItem"><strong>Consentimento demonstrativo</strong><p>A pessoa confirmou que não haveria cobrança.</p></div><div className="adminTimelineItem"><strong>Simulação encerrada</strong><p>Nenhum pedido, Pix ou etiqueta foi criado.</p></div></div><MockAction label="Alterar status (simulado)" message={`Status de ${order.id} demonstrado. Nenhum pedido foi alterado.`} /></AdminCard>
  );
}

export default function OrdersPage(): ReactElement {
  const [selected, setSelected] = useState<DemoOrder>(demoOrders[0]);
  return <><AdminPageHeader eyebrow="Operação" title="Pedidos" description="Uma prévia da fila operacional futura usando somente identificadores e estados sintéticos." /><div className="adminGrid adminGrid--metrics"><MetricCard label="Pedidos reais" value="0" detail="persistência desligada" tone="positive" /><MetricCard label="Aguardando pagamento" value="0" detail="Mercado Pago desligado" /><MetricCard label="Etiquetas" value="0" detail="Meu Envio desligado" /><MetricCard label="Fixtures" value="03" detail="dados ilustrativos" tone="brand" /></div><div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><OrdersList selectedId={selected.id} onSelect={setSelected} /><OrderDetail order={selected} /></div></>;
}
