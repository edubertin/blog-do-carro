"use client";

import type { ReactElement, ReactNode } from "react";
import { CartProvider } from "@/app/commerce/cart-provider";
import { MotionProvider } from "./motion";

type SiteProvidersProps = Readonly<{
  children: ReactNode;
  maximumCartQuantity: number;
}>;

export function SiteProviders({ children, maximumCartQuantity }: SiteProvidersProps): ReactElement {
  return <MotionProvider><CartProvider maximumQuantity={maximumCartQuantity}>{children}</CartProvider></MotionProvider>;
}
