import type { Metadata, Viewport } from "next";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/source-serif-4/600.css";
import type { ReactElement } from "react";
import { RootChrome } from "./components/root-chrome";
import "./globals.css";
import "./commerce/commerce.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://blogdocarro.com"),
  applicationName: "Blog do Carro",
  title: { default: "Blog do Carro — Negócios sobre rodas", template: "%s | Blog do Carro" },
  description: "Informação clara para comprar, vender e negociar seu próximo carro com confiança.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/blog-do-carro-icon.png", type: "image/png", sizes: "1254x1254" }],
    shortcut: "/brand/blog-do-carro-icon.png",
    apple: [{ url: "/brand/blog-do-carro-icon.png", type: "image/png", sizes: "1254x1254" }],
  },
  appleWebApp: { capable: true, title: "Blog do Carro", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Blog do Carro",
    images: [{ url: "/images/videos/spin-financiada-frame-source.png", width: 510, height: 904 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): ReactElement {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <RootChrome>{children}</RootChrome>
      </body>
    </html>
  );
}
