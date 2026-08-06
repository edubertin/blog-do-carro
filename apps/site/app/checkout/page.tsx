import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = {
  title: "Checkout demonstrativo",
  robots: { index: false, follow: false },
};

export default function CheckoutRoute(): ReactElement {
  return <main className="commercePage"><CheckoutFlow /></main>;
}
