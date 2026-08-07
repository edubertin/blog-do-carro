import { headers } from "next/headers";
import type { ReactElement } from "react";
import { adminConnectors } from "../admin-data";
import { AdminPageHeader } from "../admin-ui";
import { IntegrationControl } from "./integration-control";
import { readRuntimeInventory } from "./runtime-inventory";

export default async function IntegrationsPage(): Promise<ReactElement> {
  const inventory = readRuntimeInventory(await headers());
  return <><AdminPageHeader eyebrow="Conexões" title="Control plane" description="Inventário sanitizado do runtime, dos bindings e dos requisitos de cada conector. Valores de credenciais nunca chegam ao painel." /><IntegrationControl connectors={adminConnectors} inventory={inventory} /></>;
}
