import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CartPage } from "./cart-page";

export const metadata: Metadata = {
  title: "Carrinho demonstrativo",
  robots: { index: false, follow: false },
};

export default function CartRoute(): ReactElement {
  return <main className="commercePage"><CartPage /></main>;
}
