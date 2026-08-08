import type { Metadata } from "next";
import type { ReactElement } from "react";
import { listCatalogProducts } from "@/server/public-content-service";
import { CartPage } from "./cart-page";

export const metadata: Metadata = {
  title: "Carrinho demonstrativo",
  robots: { index: false, follow: false },
};

export default async function CartRoute(): Promise<ReactElement> {
  const products = await listCatalogProducts();
  return <main className="commercePage"><CartPage products={products} /></main>;
}
