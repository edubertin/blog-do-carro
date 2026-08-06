import type { Metadata } from "next";
import { SimplePage } from "@/app/components/simple-page";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Consulte o escopo e as condições de uso do protótipo Blog do Carro.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage(): ReactElement {
  return <SimplePage eyebrow="Informações legais" title="Termos de uso" intro="O protótipo apresenta conteúdo e fluxos demonstrativos."><h2>Escopo atual</h2><p>O checkout é apenas uma simulação. Não há oferta comercial vinculante, cobrança, pedido, envio ou publicação de comentários em ambiente externo nesta versão.</p></SimplePage>;
}
