import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { listCatalogProducts } from "@/server/public-content-service";
import { DemoOrderStatus } from "./demo-order-status";

export const metadata: Metadata = {
  title: "Simulação concluída",
  robots: { index: false, follow: false },
};

type DemoOrderRouteProps = Readonly<{ params: Promise<{ id: string }> }>;

export default async function DemoOrderRoute({ params }: DemoOrderRouteProps): Promise<ReactElement> {
  const [{ id }, products] = await Promise.all([params, listCatalogProducts()]);
  if (products.length === 0) notFound();
  return <main className="commercePage"><DemoOrderStatus orderId={id} products={products} /></main>;
}
