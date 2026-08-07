import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { getCatalogProduct } from "@/server/public-content-service";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = {
  title: "Checkout demonstrativo",
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute(): Promise<ReactElement> {
  const product = await getCatalogProduct("chaveiro-presente");
  if (!product) notFound();
  return <main className="commercePage"><CheckoutFlow product={product} /></main>;
}
