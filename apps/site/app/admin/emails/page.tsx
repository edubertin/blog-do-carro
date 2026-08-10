import type { Metadata } from "next";
import type { ReactElement } from "react";
import { buildAudienceConfirmationEmail, buildCustomerAccessEmail } from "@/server/email-templates";
import { AdminCard, AdminPageHeader } from "../admin-ui";

export const metadata: Metadata = {
  title: "Prévias de e-mail",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

type Preview = Readonly<{
  id: string;
  label: string;
  description: string;
  subject: string;
  html: string;
}>;

const fixtureToken = "PREVIA-SEM-TOKEN-REAL";

function previewHtml(html: string): string {
  return html.replace("https://blogdocarro.com/brand/", "/brand/");
}

function emailPreviews(): readonly Preview[] {
  const confirmation = `https://blogdocarro.com/confirmar-inscricao#token=${fixtureToken}`;
  const access = `https://blogdocarro.com/entrar/confirmar#token=${fixtureToken}`;
  const newsletter = buildAudienceConfirmationEmail(confirmation, "editorial_newsletter");
  const store = buildAudienceConfirmationEmail(confirmation, "store_launch");
  const customer = buildCustomerAccessEmail(access);
  return [
    { id: "newsletter", label: "Newsletter editorial", description: "Double opt-in para artigos e análises.", ...newsletter, html: previewHtml(newsletter.html) },
    { id: "store", label: "Loja da Comunidade", description: "Confirmação de interesse, sem compra ou reserva.", ...store, html: previewHtml(store.html) },
    { id: "access", label: "Acesso do cliente", description: "Magic link transacional, preparado para a futura área de pedidos.", ...customer, html: previewHtml(customer.html) },
  ];
}

function EmailPreview({ preview }: Readonly<{ preview: Preview }>): ReactElement {
  return (
    <AdminCard className="emailPreviewCard" eyebrow={preview.label} title={preview.subject}>
      <p className="adminCardLead">{preview.description}</p>
      <iframe className="emailPreviewFrame" sandbox="allow-same-origin" srcDoc={preview.html} title={`Prévia: ${preview.label}`} />
    </AdminCard>
  );
}

export default function EmailPreviewsPage(): ReactElement {
  return (
    <>
      <AdminPageHeader eyebrow="E-mails" title="A mesma marca, três mensagens claras" description="Prévias seguras dos e-mails de newsletter, interesse na loja e acesso do cliente. Nenhum envio é realizado nesta tela." />
      <div className="emailPreviewNotice" role="note"><strong>Resend pausado</strong><span>DNS, chave e webhooks continuam pendentes. Os links e tokens abaixo são apenas fixtures visuais.</span></div>
      <div className="emailPreviewGrid">{emailPreviews().map((preview) => <EmailPreview preview={preview} key={preview.id} />)}</div>
    </>
  );
}
