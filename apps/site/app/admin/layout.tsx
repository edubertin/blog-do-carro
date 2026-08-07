import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { BrandLogo } from "@/app/components/brand-logo";
import { SiteLink as Link } from "@/app/components/site-link";
import { adminSignOutPath } from "./admin-auth-core";
import { requireAdminPage } from "./admin-auth";
import { AdminShell } from "./admin-shell";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Central administrativa", template: "%s | Central Blog do Carro" },
  description: "Demonstração local dos fluxos administrativos do Blog do Carro.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

function AccessDenied(): ReactElement {
  return (
    <main className="adminAccessScreen">
      <section className="adminAccessCard" aria-labelledby="admin-access-title">
        <BrandLogo eager />
        <span>Acesso protegido</span>
        <h1 id="admin-access-title">Central indisponível para esta conta</h1>
        <p>A autorização administrativa é validada no servidor. Saia para escolher outra conta.</p>
        <Link className="adminAccessExit" href={adminSignOutPath("/")}>Sair e trocar de conta</Link>
      </section>
    </main>
  );
}

export default async function AdminLayout(
  { children }: Readonly<{ children: ReactNode }>,
): Promise<ReactElement> {
  const identity = await requireAdminPage("content.read");
  if (!identity) return <AccessDenied />;
  const exitHref = identity.localPreview ? "/" : adminSignOutPath("/");
  return (
    <AdminShell displayName={identity.displayName} localPreview={identity.localPreview} exitHref={exitHref}>
      {children}
    </AdminShell>
  );
}
