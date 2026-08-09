import { HomePage } from "./components/home-page";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { getHomeProjection, listCatalogProducts } from "@/server/public-content-service";
import { getPublicAudienceConfig } from "@/server/runtime-bindings";

export const metadata: Metadata = {
  title: "Blog do Carro — Negócios sobre rodas",
  description: "Vídeos, análises e informação clara para comprar, vender e negociar veículos com confiança.",
  alternates: { canonical: "/" },
};

export default async function Home(): Promise<ReactElement> {
  const [projection, products] = await Promise.all([
    getHomeProjection(),
    listCatalogProducts(),
  ]);
  return <HomePage projection={projection} products={products.slice(0, 2)} audienceConfig={getPublicAudienceConfig()} />;
}
