import type { Metadata } from "next";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { SimplePage } from "@/app/components/simple-page";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe editorial do Blog do Carro.",
  alternates: { canonical: "/contato" },
};

export default function ContactPage(): ReactElement {
  return <SimplePage eyebrow="Fale conosco" title="A garagem está aberta." intro="Envie pautas, sugestões comerciais e histórias da comunidade."><h2>Contato editorial</h2><p>O canal oficial será conectado aqui antes da publicação. Por enquanto, explore a demonstração ou volte para os artigos.</p><Link className="primaryButton inlineButton" href="/">Explorar o Blog</Link></SimplePage>;
}
