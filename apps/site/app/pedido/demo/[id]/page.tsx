import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DemoOrderStatus } from "./demo-order-status";

export const metadata: Metadata = {
  title: "Simulação concluída",
  robots: { index: false, follow: false },
};

type DemoOrderRouteProps = Readonly<{ params: Promise<{ id: string }> }>;

export default async function DemoOrderRoute({ params }: DemoOrderRouteProps): Promise<ReactElement> {
  const { id } = await params;
  return <main className="commercePage"><DemoOrderStatus orderId={id} /></main>;
}
