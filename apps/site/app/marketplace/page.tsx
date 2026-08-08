import type { Metadata } from "next";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { SimplePage } from "@/app/components/simple-page";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Conheça a visão do futuro marketplace automotivo do Blog do Carro.",
  alternates: { canonical: "/marketplace" },
};

export default function MarketplacePage(): ReactElement {
  return <SimplePage eyebrow="Em preparação" title="O próximo negócio começa aqui." intro="A arquitetura já reserva espaço para anúncios, favoritos, comparador e área do anunciante."><h2>Produtos da garagem</h2><p>Conheça os primeiros conceitos em impressão 3D da Loja da comunidade.</p><Link className="primaryButton inlineButton" href="/loja">Conhecer a loja</Link></SimplePage>;
}
