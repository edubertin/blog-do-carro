import type { Metadata } from "next";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Package } from "@phosphor-icons/react/dist/ssr/Package";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { StoreInterestForm } from "@/app/components/lead-forms";
import { Reveal } from "@/app/components/motion";
import { getCatalogProduct } from "@/server/public-content-service";
import { getPublicAudienceConfig } from "@/server/runtime-bindings";

export const metadata: Metadata = {
  title: "Chaveiro Blog do Carro",
  description: "Conheça o conceito em impressão 3D e o fluxo demonstrativo de compra do chaveiro Blog do Carro.",
  alternates: { canonical: "/loja/chaveiro-presente" },
};

const benefits = [
  [Package, "Edição da comunidade", "Um produto nascido de uma brincadeira que já é parte dos comentários."],
  [ShieldCheck, "Fluxo protegido", "Pagamento e entrega permanecem simulados até a homologação das integrações."],
  [Check, "Demonstração sem cobrança", "Você percorre todas as etapas sem criar uma compra ou envio real."],
] as const;

export default async function ProductPage(): Promise<ReactElement> {
  const product = await getCatalogProduct("chaveiro-blog-do-carro");
  if (!product) notFound();
  return (
    <main className="productPage">
      <Reveal className="productGallery"><Image src={product.imageUrl} alt={product.imageAlt} fill loading="eager" fetchPriority="high" sizes="(max-width: 1023px) 100vw, 50vw" /></Reveal>
      <Reveal className="productDetails" delay={0.08}>
        <Link className="backLink" href="/loja">← Voltar à loja</Link><span className="eyebrow">{product.collectionName}</span><h1>{product.name}</h1><p className="productLead">{product.description}</p><p className="validationNotice">Loja em pré-lançamento — cadastre seu interesse para ser avisado quando as vendas abrirem.</p>
        <div className="benefitList">{benefits.map(([Icon, title, text]) => <div key={title}><Icon size={22} weight="fill" /><p><strong>{title}</strong><span>{text}</span></p></div>)}</div>
        <StoreInterestForm config={getPublicAudienceConfig()} productId={product.slug} />
      </Reveal>
    </main>
  );
}
