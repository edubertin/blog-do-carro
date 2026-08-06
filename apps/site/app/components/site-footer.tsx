import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import { BrandLogo } from "./brand-logo";

export function SiteFooter(): ReactElement {
  return (
    <footer className="siteFooter">
      <div className="footerBrand">
        <BrandLogo />
        <p>Negócios sobre rodas, explicados com clareza.</p>
      </div>
      <div className="footerLinks">
        <Link href="/sobre">Sobre</Link>
        <Link href="/contato">Contato</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos</Link>
      </div>
      <p className="copyright">© 2026 Blog do Carro. Todos os direitos reservados.</p>
    </footer>
  );
}
