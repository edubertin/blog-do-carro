"use client";

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import type { NavigationProjection } from "@/domain/public-content";
import { SiteFooter } from "./site-footer";
import { SiteNavigation } from "./site-navigation";
import { SiteProviders } from "./site-providers";

type RootChromeProps = Readonly<{
  children: ReactNode;
  navigation: NavigationProjection;
  maximumCartQuantity: number;
}>;

export function RootChrome({ children, navigation, maximumCartQuantity }: RootChromeProps): ReactElement {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <SiteProviders maximumCartQuantity={maximumCartQuantity}><SiteNavigation navigation={navigation} />{children}<SiteFooter /></SiteProviders>;
}
