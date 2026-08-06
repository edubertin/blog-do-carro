import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { AdminShell } from "./admin-shell";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Central administrativa", template: "%s | Central Blog do Carro" },
  description: "Demonstração local dos fluxos administrativos do Blog do Carro.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return <AdminShell>{children}</AdminShell>;
}
