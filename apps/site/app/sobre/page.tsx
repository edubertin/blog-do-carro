import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SimplePage } from "@/app/components/simple-page";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conheça a proposta editorial e os compromissos do Blog do Carro.",
  alternates: { canonical: "/sobre" },
};

export default function AboutPage(): ReactElement {
  return <SimplePage eyebrow="Quem somos" title="O carro é o começo da conversa." intro="O Blog do Carro traduz o mercado automotivo para quem precisa tomar decisões melhores."><h2>Informação com contexto</h2><p>Falamos de compra, venda, manutenção, tendências e oportunidades sem transformar o leitor em especialista à força.</p><h2>Opinião identificada</h2><p>Dados e fatos ficam separados do nosso parecer. Assim, você sabe o que aconteceu e também como enxergamos o assunto.</p></SimplePage>;
}
