"use client";

import type { ReactElement, ReactNode } from "react";
import { CartProvider } from "@/app/commerce/cart-provider";
import { MotionProvider } from "./motion";

export function SiteProviders({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return <MotionProvider><CartProvider>{children}</CartProvider></MotionProvider>;
}
