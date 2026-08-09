import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StoreClosed } from "@/app/components/commerce/store-closed";

export const metadata: Metadata = {
  title: "Checkout demonstrativo",
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute(): Promise<ReactElement> {
  return <main className="commercePage"><StoreClosed /></main>;
}
