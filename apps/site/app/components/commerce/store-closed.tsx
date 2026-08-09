import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";

export function StoreClosed(): ReactElement {
  return <section className="commerceCard storeClosed"><span className="eyebrow">Loja da comunidade · Em breve</span><h1>As vendas ainda não começaram.</h1><p>Os produtos continuam na garagem enquanto preparamos pagamento, envio e atendimento. Você pode cadastrar seu interesse para ser avisado no lançamento.</p><Link className="primaryButton" href="/loja#lista">Conhecer os produtos</Link></section>;
}
