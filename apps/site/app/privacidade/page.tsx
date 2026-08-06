import type { Metadata } from "next";
import { SimplePage } from "@/app/components/simple-page";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Entenda como o protótipo do Blog do Carro trata dados e recursos demonstrativos.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage(): ReactElement {
  return <SimplePage eyebrow="Transparência" title="Privacidade" intro="Esta demonstração não envia dados pessoais nem processa pagamentos."><h2>Dados locais do mock</h2><p>O carrinho salva somente produto e quantidade neste navegador. A confirmação guarda uma referência demonstrativa sem nome, e-mail, telefone ou endereço.</p><h2>Antes da publicação</h2><p>A política definitiva será adaptada aos serviços de analytics, newsletter, comentários e comércio realmente ativados no produto.</p></SimplePage>;
}
