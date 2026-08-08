import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { listCatalogProducts } from "@/server/public-content-service";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = {
  title: "Checkout demonstrativo",
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute(): Promise<ReactElement> {
  const products = await listCatalogProducts();
  if (products.length === 0) notFound();
  return <main className="commercePage"><CheckoutFlow catalogProducts={products} /></main>;
}
