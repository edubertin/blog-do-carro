import type { Metadata } from "next";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Package } from "@phosphor-icons/react/dist/ssr/Package";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { keychainProduct } from "@/app/commerce/catalog";
import { ProductPurchasePanel } from "@/app/components/commerce/product-purchase-panel";
import { Reveal } from "@/app/components/motion";

export const metadata: Metadata = {
  title: "Chaveiro Presente",
  description: "Conheça o fluxo demonstrativo de compra do Chaveiro Presente da comunidade Blog do Carro.",
  alternates: { canonical: "/loja/chaveiro-presente" },
};

const benefits = [
  [Package, "Edição da comunidade", "Um produto nascido de uma brincadeira que já é parte dos comentários."],
  [ShieldCheck, "Fluxo protegido", "Pagamento e entrega permanecem simulados até a homologação das integrações."],
  [Check, "Demonstração sem cobrança", "Você percorre todas as etapas sem criar uma compra ou envio real."],
] as const;

export default function ProductPage(): ReactElement {
  return (
    <main className="productPage">
      <Reveal className="productGallery"><Image src={keychainProduct.image} alt="Chaveiro Blog do Carro com menino dizendo Presente" fill loading="eager" fetchPriority="high" sizes="(max-width: 1023px) 100vw, 50vw" /></Reveal>
      <Reveal className="productDetails" delay={0.08}>
        <Link className="backLink" href="/loja">← Voltar à loja</Link><span className="eyebrow">{keychainProduct.collection}</span><h1>{keychainProduct.name}</h1><p className="productLead">{keychainProduct.description}</p><p className="validationNotice">Compra simulada — nenhuma cobrança, etiqueta ou envio será realizado.</p>
        <div className="benefitList">{benefits.map(([Icon, title, text]) => <div key={title}><Icon size={22} weight="fill" /><p><strong>{title}</strong><span>{text}</span></p></div>)}</div>
        <ProductPurchasePanel />
      </Reveal>
    </main>
  );
}
