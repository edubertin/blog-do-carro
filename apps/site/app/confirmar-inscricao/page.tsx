import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ConfirmationClient } from "./confirmation-client";

export const metadata: Metadata = { title: "Confirmar inscrição", robots: { index: false, follow: false } };

export default function ConfirmationPage(): ReactElement {
  return <main className="simplePage"><section className="simpleIntro"><span className="eyebrow">Blog do Carro</span><h1>Confirme seu e-mail.</h1><p>Esta etapa protege sua inscrição e garante que o endereço pertence a você.</p><div className="simpleContent"><ConfirmationClient /></div></section></main>;
}
