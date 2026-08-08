import type { Metadata } from "next";
import { Package } from "@phosphor-icons/react/dist/ssr/Package";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import type { ReactElement } from "react";
import { HomeStoreCarousel } from "@/app/components/commerce/home-store-carousel";
import { NewsletterForm } from "@/app/components/lead-forms";
import { Reveal } from "@/app/components/motion";
import { listCatalogProducts } from "@/server/public-content-service";

export const metadata: Metadata = {
  title: "Loja da Comunidade",
  description: "Produtos criados a partir das histórias e brincadeiras da comunidade Blog do Carro.",
  alternates: { canonical: "/loja" },
};

function StoreValues(): ReactElement {
  return (
    <div className="storeValues">
      <div><UsersThree size={22} weight="fill" /><strong>Nasce nos comentários</strong><span>A comunidade ajuda a escolher cada lançamento.</span></div>
      <div><Package size={22} weight="fill" /><strong>Lotes pequenos</strong><span>Primeira edição somente após validar interesse e qualidade.</span></div>
      <div><Sparkle size={22} weight="fill" /><strong>Com história</strong><span>Nada de catálogo genérico: cada peça precisa ter um motivo.</span></div>
    </div>
  );
}

export default async function StorePage(): Promise<ReactElement> {
  const products = await listCatalogProducts();
  return (
    <main className="storePage">
      <Reveal className="storeIntro"><span className="eyebrow">Garagem do Blog</span><h1>Loja da comunidade.</h1><p>Produtos que saem das histórias do canal e ganham vida fora da tela.</p></Reveal>
      <Reveal className="storeCatalog" delay={0.08}><HomeStoreCarousel products={products.slice(0, 2)} /></Reveal>
      <Reveal className="storeManifest" delay={0.12}><span className="eyebrow">Como funciona</span><h2>A comunidade chama. A gente cria.</h2><StoreValues /></Reveal>
      <Reveal className="storeWaitlist" delay={0.14}><h2>Quer saber do próximo drop?</h2><p>Entre na lista da garagem e receba a abertura do primeiro lote.</p><NewsletterForm /></Reveal>
    </main>
  );
}
