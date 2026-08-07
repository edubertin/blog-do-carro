import { HomePage } from "./components/home-page";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { getCatalogProduct, getHomeProjection } from "@/server/public-content-service";

export const metadata: Metadata = {
  title: "Blog do Carro — Negócios sobre rodas",
  description: "Vídeos, análises e informação clara para comprar, vender e negociar veículos com confiança.",
  alternates: { canonical: "/" },
};

export default async function Home(): Promise<ReactElement> {
  const [projection, product] = await Promise.all([
    getHomeProjection(),
    getCatalogProduct("chaveiro-presente"),
  ]);
  return <HomePage projection={projection} product={product} />;
}
