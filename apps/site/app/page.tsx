import { HomePage } from "./components/home-page";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Blog do Carro — Negócios sobre rodas",
  description: "Vídeos, análises e informação clara para comprar, vender e negociar veículos com confiança.",
  alternates: { canonical: "/" },
};

export default function Home(): ReactElement {
  return <HomePage />;
}
