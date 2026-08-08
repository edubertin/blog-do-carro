"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import type { AdminConnector, MockStatus } from "../admin-data";
import { StatusPill } from "../admin-ui";
import type { RuntimeInventory } from "./runtime-inventory";

type ConfigurationState = "missing" | "partial" | "configured" | "fixture";

const modeLabels: Readonly<Record<AdminConnector["mode"], string>> = {
  disabled: "desabilitado",
  sandbox: "sandbox",
};

const healthLabels: Readonly<Record<AdminConnector["health"], string>> = {
  unknown: "não verificada",
  simulated: "simulada",
};

const activationLabels: Readonly<Record<AdminConnector["activation"], string>> = {
  inactive: "inativa",
  blocked: "bloqueada",
};

const configurationLabels: Readonly<Record<ConfigurationState, string>> = {
  missing: "ausente",
  partial: "parcial",
  configured: "configurada",
  fixture: "fixture local",
};

function requirementConfigured(
  connector: AdminConnector,
  item: string,
  inventory: RuntimeInventory,
): boolean {
  if (connector.id === "d1") return inventory.bindings.includes("d1");
  if (connector.id === "r2") return inventory.bindings.includes("r2");
  return inventory.configuredKeys.includes(item);
}

function configurationState(connector: AdminConnector, inventory: RuntimeInventory): ConfigurationState {
  const requirements = [...connector.requiredSettings, ...connector.requiredSecrets];
  const configured = requirements.filter((item) => requirementConfigured(connector, item, inventory));
  if (connector.configuration === "fixture" && configured.length === 0) return "fixture";
  if (configured.length === 0) return "missing";
  return configured.length === requirements.length ? "configured" : "partial";
}

function connectorStatus(connector: AdminConnector, inventory: RuntimeInventory): MockStatus {
  if (connector.id === "d1" && inventory.bindings.includes("d1")) return "managed";
  if (connector.id === "r2" && inventory.bindings.includes("r2")) return "managed";
  return connector.status;
}

function ConnectorList({ connectors, inventory, selectedId, onSelect }: Readonly<{
  connectors: readonly AdminConnector[];
  inventory: RuntimeInventory;
  selectedId: string;
  onSelect: (id: string) => void;
}>): ReactElement {
  return <div className="adminConnectorList" role="list">{connectors.map((connector) => (
    <button className={connector.id === selectedId ? "adminConnectorButton isSelected" : "adminConnectorButton"} type="button" onClick={() => onSelect(connector.id)} aria-pressed={connector.id === selectedId} key={connector.id}>
      <span><strong>{connector.name}</strong><small>{connector.area}</small></span>
      <StatusPill status={connectorStatus(connector, inventory)} />
    </button>
  ))}</div>;
}

function RuntimeCard({ title, status, value, detail }: Readonly<{
  title: string;
  status: MockStatus;
  value: string;
  detail: string;
}>): ReactElement {
  return <article className="adminCard adminRuntimeCard"><StatusPill status={status} /><span>{title}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function RuntimeOverview({ inventory }: Readonly<{ inventory: RuntimeInventory }>): ReactElement {
  const hosted = inventory.source === "sites";
  const ownerConfigured = inventory.configuredKeys.includes("ADMIN_OWNER_USER_IDS");
  const ownerEmailBootstrapConfigured = inventory.configuredKeys.includes("ADMIN_OWNER_EMAIL_ALLOWLIST")
    && inventory.configuredKeys.includes("ADMIN_EMAIL_BOOTSTRAP_ENABLED");
  const assetsConfigured = inventory.bindings.includes("assets");
  const imagesConfigured = inventory.bindings.includes("images");
  const dataBindings = [inventory.bindings.includes("d1") ? "D1" : null, inventory.bindings.includes("r2") ? "R2" : null].filter(Boolean);
  const cmsWrites = inventory.configuredKeys.includes("CMS_WRITE_ENABLED");
  const publicReads = inventory.configuredKeys.includes("CMS_PUBLIC_READ_ENABLED");
  const mediaUploads = inventory.configuredKeys.includes("MEDIA_UPLOAD_ENABLED");
  const capabilityFlags = [cmsWrites ? "escrita" : null, publicReads ? "leitura pública" : null, mediaUploads ? "upload" : null].filter(Boolean);
  return (
    <section className="adminRuntimeSection" aria-labelledby="runtime-heading">
      <div className="adminRuntimeHeader"><div><span className="adminEyebrow">Leitura desta requisição</span><h2 id="runtime-heading">Fundação operacional</h2></div><p>Metadados sanitizados gerados no Worker, sem valores de credenciais.</p></div>
      <div className="adminRuntimeGrid">
        <RuntimeCard title="Hospedagem" status={hosted ? "connected" : "mock"} value={hosted ? "Sites + Worker" : "Prévia local"} detail="O portal é executado no runtime Cloudflare administrado pelo Sites." />
        <RuntimeCard title="Administração" status={hosted && ownerConfigured ? "connected" : hosted ? "blocked" : "mock"} value={hosted ? "SIWC" : "Owner local"} detail={hosted ? `Identidade e allowlist são validadas antes das rotas administrativas.${ownerEmailBootstrapConfigured ? " Bootstrap temporário de owner configurado." : ""}` : "Identidade sintética limitada ao loopback."} />
        <RuntimeCard title="Assets e imagens" status={assetsConfigured ? "connected" : "managed"} value={imagesConfigured ? "Transformação ativa" : "Fallback seguro"} detail="O binding de imagens é opcional; a origem continua servida sem expor configuração." />
        <RuntimeCard title="Dados" status={dataBindings.length ? "managed" : "not_connected"} value={dataBindings.length ? `${dataBindings.join(" + ")} provisionados` : "D1 e R2 ausentes"} detail={capabilityFlags.length ? `Flags presentes para: ${capabilityFlags.join(", ")}; o servidor ainda valida o valor.` : "Bindings não ativam leitura, escrita ou upload sozinhos."} />
        <RuntimeCard title="Acesso e domínio" status="managed" value="Controlado no Sites" detail="A política pública e o domínio não são lidos pelo app nem exigem credencial de control plane." />
      </div>
    </section>
  );
}

function ConnectorStates({ connector, inventory }: Readonly<{
  connector: AdminConnector;
  inventory: RuntimeInventory;
}>): ReactElement {
  const states = [
    { label: "Modo permitido", value: modeLabels[connector.mode] },
    { label: "Configuração", value: configurationLabels[configurationState(connector, inventory)] },
    { label: "Saúde", value: healthLabels[connector.health] },
    { label: "Ativação", value: activationLabels[connector.activation] },
  ];
  return <div className="adminStateGrid">{states.map((state) => <div className="adminStateCell" key={state.label}><span>{state.label}</span><strong>{state.value}</strong></div>)}</div>;
}

function ConfigurationRows({ connector, inventory, title, items, secret }: Readonly<{
  connector: AdminConnector;
  inventory: RuntimeInventory;
  title: string;
  items: readonly string[];
  secret?: boolean;
}>): ReactElement {
  return (
    <section className="adminFormSection"><h2>{title}</h2><p>{secret ? "O Worker informa somente se o nome lógico está configurado. O valor nunca é transmitido." : "Parâmetros e bindings são confirmados no servidor a cada leitura."}</p><div className="adminSecretList">{items.length ? items.map((item) => {
      const configured = requirementConfigured(connector, item, inventory);
      return <div className="adminSecretRow" data-configured={configured} key={item}><code>{item}</code><span>{configured ? secret ? "configurado no Sites" : "configurado" : "não configurado"}</span></div>;
    }) : <div className="adminCallout">Este conector não exige secret adicional no contrato atual.</div>}</div></section>
  );
}

function ConnectorFlow({ connector }: Readonly<{ connector: AdminConnector }>): ReactElement {
  return (
    <section className="adminFormSection"><h2>Fluxo de ativação</h2><p>A capacidade real só existirá quando todos os gates server-side estiverem válidos.</p><div className="adminTimeline">
      <div className="adminTimelineItem"><strong>1. Preparar ambiente</strong><p>Conta sandbox, políticas e origem canônica aprovadas.</p></div>
      <div className="adminTimelineItem"><strong>2. Inserir secrets no Sites</strong><p>O painel recebe apenas o estado configurado, nunca o valor.</p></div>
      <div className="adminTimelineItem"><strong>3. Testar no servidor</strong><p>Timeout, health check e log sanitizado.</p></div>
      <div className="adminTimelineItem"><strong>4. Autorizar ativação</strong><p>RBAC, reautenticação, flag server-side e audit log.</p></div>
    </div><p className="adminCallout"><strong>Próximo passo:</strong> {connector.nextStep}</p></section>
  );
}

function RefreshInventory(): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="adminRefreshAction"><button className="adminButton adminButton--secondary" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Atualizando…" : "Atualizar leitura"}</button><span role="status">{pending ? "Consultando o runtime desta página." : "Nenhum provedor externo será contatado."}</span></div>;
}

function ConnectorDetail({ connector, inventory }: Readonly<{
  connector: AdminConnector;
  inventory: RuntimeInventory;
}>): ReactElement {
  return (
    <div className="adminConnectorDetail adminCard"><div className="adminConnectorHero"><StatusPill status={connectorStatus(connector, inventory)} /><h2>{connector.name}</h2><p>{connector.summary}</p></div><ConnectorStates connector={connector} inventory={inventory} />
      <ConfigurationRows connector={connector} inventory={inventory} title="Configurações exigidas" items={connector.requiredSettings} />
      <ConfigurationRows connector={connector} inventory={inventory} title="Secrets exigidos" items={connector.requiredSecrets} secret />
      <section className="adminFormSection"><h2>Superfícies relacionadas</h2><div className="adminConnectorRoutes">{connector.relatedRoutes.map((route) => <code key={route}>{route}</code>)}</div></section>
      <ConnectorFlow connector={connector} /><RefreshInventory />
    </div>
  );
}

export function IntegrationControl({ connectors, inventory }: Readonly<{
  connectors: readonly AdminConnector[];
  inventory: RuntimeInventory;
}>): ReactElement {
  const [selectedId, setSelectedId] = useState(connectors[0]?.id ?? "");
  const selected = connectors.find((connector) => connector.id === selectedId) ?? connectors[0];
  if (!selected) return <p>Nenhum conector foi definido.</p>;
  return <><RuntimeOverview inventory={inventory} /><div className="adminConnectorLayout"><div className="adminCard"><ConnectorList connectors={connectors} inventory={inventory} selectedId={selected.id} onSelect={setSelectedId} /></div><ConnectorDetail connector={selected} inventory={inventory} /></div></>;
}
