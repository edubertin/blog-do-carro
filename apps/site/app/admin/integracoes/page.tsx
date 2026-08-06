import type { ReactElement } from "react";
import { adminConnectors } from "../admin-data";
import { AdminPageHeader } from "../admin-ui";
import { IntegrationControl } from "./integration-control";

export default function IntegrationsPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Conexões" title="Control plane" description="Veja o que cada integração exigirá, onde impacta o produto e quais gates impedem uma ativação insegura." /><IntegrationControl connectors={adminConnectors} /></>;
}
