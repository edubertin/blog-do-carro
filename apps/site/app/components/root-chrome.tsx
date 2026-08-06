"use client";

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteNavigation } from "./site-navigation";
import { SiteProviders } from "./site-providers";

type RootChromeProps = Readonly<{ children: ReactNode }>;

export function RootChrome({ children }: RootChromeProps): ReactElement {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <SiteProviders><SiteNavigation />{children}<SiteFooter /></SiteProviders>;
}
