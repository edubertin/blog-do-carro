import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StoreClosed } from "@/app/components/commerce/store-closed";

export const metadata: Metadata = {
  title: "Carrinho demonstrativo",
  robots: { index: false, follow: false },
};

export default async function CartRoute(): Promise<ReactElement> {
  return <main className="commercePage"><StoreClosed /></main>;
}
