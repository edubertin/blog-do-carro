import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { getCatalogProduct } from "@/server/public-content-service";
import { CartPage } from "./cart-page";

export const metadata: Metadata = {
  title: "Carrinho demonstrativo",
  robots: { index: false, follow: false },
};

export default async function CartRoute(): Promise<ReactElement> {
  const product = await getCatalogProduct("chaveiro-presente");
  if (!product) notFound();
  return <main className="commercePage"><CartPage product={product} /></main>;
}
