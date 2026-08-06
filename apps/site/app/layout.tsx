import type { Metadata } from "next";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/source-serif-4/600.css";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { BrandLogo } from "./components/brand-logo";
import { SiteNavigation } from "./components/site-navigation";
import { SiteProviders } from "./components/site-providers";
import "./globals.css";
import "./commerce/commerce.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://blogdocarro.com"),
  title: { default: "Blog do Carro — Negócios sobre rodas", template: "%s | Blog do Carro" },
  description: "Informação clara para comprar, vender e negociar seu próximo carro com confiança.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Blog do Carro",
    images: [{ url: "/images/videos/spin-financiada-frame-source.png", width: 510, height: 904 }],
  },
  robots: { index: true, follow: true },
};

function Footer(): ReactElement {
  return (
    <footer className="siteFooter">
      <div className="footerBrand"><BrandLogo /><p>Negócios sobre rodas, explicados com clareza.</p></div>
      <div className="footerLinks"><Link href="/sobre">Sobre</Link><Link href="/contato">Contato</Link><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></div>
      <p className="copyright">© 2026 Blog do Carro. Todos os direitos reservados.</p>
    </footer>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): ReactElement {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <SiteProviders><SiteNavigation />{children}<Footer /></SiteProviders>
      </body>
    </html>
  );
}
