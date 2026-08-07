import type { Metadata } from "next";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { Package } from "@phosphor-icons/react/dist/ssr/Package";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { formatMoney } from "@/app/commerce/catalog";
import { NewsletterForm } from "@/app/components/lead-forms";
import { Reveal } from "@/app/components/motion";
import { getCatalogProduct } from "@/server/public-content-service";

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
  const product = await getCatalogProduct("chaveiro-presente");
  if (!product) notFound();
  return (
    <main className="storePage">
      <Reveal className="storeIntro"><span className="eyebrow">Garagem do Blog</span><h1>Loja da comunidade.</h1><p>Produtos que saem das histórias do canal e ganham vida fora da tela.</p></Reveal>
      <Reveal className="storeFeature" delay={0.08}>
        <Link className="storeFeatureImage" href="/loja/chaveiro-presente"><Image src={product.imageUrl} alt={product.imageAlt} fill loading="eager" fetchPriority="high" sizes="(max-width: 1023px) 100vw, 700px" /></Link>
        <div className="storeFeatureCopy"><span className="storeBadge">Coleção Presença · 01</span><h2>{product.name}</h2><p>O primeiro drop para quem acompanha as negociações e nunca falta à chamada.</p><span className="prototypePrice">Mock de compra · {formatMoney(product.priceCents)}</span><Link className="primaryButton" href="/loja/chaveiro-presente">Experimentar a compra <ArrowRight size={20} weight="bold" /></Link></div>
      </Reveal>
      <Reveal className="storeManifest" delay={0.12}><span className="eyebrow">Como funciona</span><h2>A comunidade chama. A gente cria.</h2><StoreValues /></Reveal>
      <Reveal className="storeWaitlist" delay={0.14}><h2>Quer saber do próximo drop?</h2><p>Entre na lista da garagem e receba a abertura do primeiro lote.</p><NewsletterForm /></Reveal>
    </main>
  );
}
