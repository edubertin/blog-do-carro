"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import type { AdminConnector } from "../admin-data";
import { StatusPill } from "../admin-ui";
import { MockAction } from "../mock-action";

function ConnectorList({ connectors, selectedId, onSelect }: Readonly<{ connectors: readonly AdminConnector[]; selectedId: string; onSelect: (id: string) => void }>): ReactElement {
  return <div className="adminConnectorList" role="list">{connectors.map((connector) => <button className={connector.id === selectedId ? "adminConnectorButton isSelected" : "adminConnectorButton"} type="button" onClick={() => onSelect(connector.id)} aria-pressed={connector.id === selectedId} key={connector.id}><span><strong>{connector.name}</strong><small>{connector.area}</small></span><StatusPill status={connector.status} /></button>)}</div>;
}

function ConnectorStates({ connector }: { connector: AdminConnector }): ReactElement {
  const states = [{ label: "Modo permitido", value: connector.mode }, { label: "Configuração", value: connector.configuration }, { label: "Saúde", value: connector.health }, { label: "Ativação", value: connector.activation }];
  return <div className="adminStateGrid">{states.map((state) => <div className="adminStateCell" key={state.label}><span>{state.label}</span><strong>{state.value}</strong></div>)}</div>;
}

function ConfigurationRows({ title, items, secret }: Readonly<{ title: string; items: readonly string[]; secret?: boolean }>): ReactElement {
  return (
    <section className="adminFormSection"><h2>{title}</h2><p>{secret ? "Somente os nomes são mostrados. Os valores reais ficam fora do painel, no mecanismo de secrets do Sites." : "Parâmetros não sensíveis que o adapter precisará validar no servidor."}</p><div className="adminSecretList">{items.length ? items.map((item) => <div className="adminSecretRow" key={item}><code>{item}</code><span>{secret ? "valor oculto" : "não definido"}</span></div>) : <div className="adminCallout">Este conector não exige secret adicional no contrato atual.</div>}</div></section>
  );
}

function ConnectorFlow({ connector }: { connector: AdminConnector }): ReactElement {
  return (
    <section className="adminFormSection"><h2>Fluxo de ativação</h2><p>A capacidade real só existirá quando todos os gates server-side estiverem válidos.</p><div className="adminTimeline"><div className="adminTimelineItem"><strong>1. Preparar ambiente</strong><p>Conta sandbox, políticas e origem canônica aprovadas.</p></div><div className="adminTimelineItem"><strong>2. Inserir secrets no Sites</strong><p>O painel recebe apenas o estado configurado, nunca o valor.</p></div><div className="adminTimelineItem"><strong>3. Testar no servidor</strong><p>Timeout, health check e log sanitizado.</p></div><div className="adminTimelineItem"><strong>4. Autorizar ativação</strong><p>RBAC, reautenticação, flag server-side e audit log.</p></div></div><p className="adminCallout"><strong>Próximo passo:</strong> {connector.nextStep}</p></section>
  );
}

function ConnectorDetail({ connector }: { connector: AdminConnector }): ReactElement {
  return (
    <div className="adminConnectorDetail adminCard"><div className="adminConnectorHero"><StatusPill status={connector.status} /><h2>{connector.name}</h2><p>{connector.summary}</p></div><ConnectorStates connector={connector} /><ConfigurationRows title="Configurações exigidas" items={connector.requiredSettings} /><ConfigurationRows title="Secrets exigidos" items={connector.requiredSecrets} secret /><section className="adminFormSection"><h2>Superfícies relacionadas</h2><div className="adminConnectorRoutes">{connector.relatedRoutes.map((route) => <code key={route}>{route}</code>)}</div></section><ConnectorFlow connector={connector} /><MockAction label="Simular preflight" message={`Preflight de ${connector.name} concluído localmente. Nenhum serviço foi contatado.`} /></div>
  );
}

export function IntegrationControl({ connectors }: Readonly<{ connectors: readonly AdminConnector[] }>): ReactElement {
  const [selectedId, setSelectedId] = useState(connectors[0]?.id ?? "");
  const selected = connectors.find((connector) => connector.id === selectedId) ?? connectors[0];
  if (!selected) return <p>Nenhum conector foi definido.</p>;
  return <div className="adminConnectorLayout"><div className="adminCard"><ConnectorList connectors={connectors} selectedId={selected.id} onSelect={setSelectedId} /></div><ConnectorDetail connector={selected} /></div>;
}
