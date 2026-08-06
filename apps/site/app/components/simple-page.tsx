import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement, ReactNode } from "react";
import { Reveal } from "./motion";

type SimplePageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function SimplePage({ eyebrow, title, intro, children }: SimplePageProps): ReactElement {
  return (
    <main className="simplePage">
      <Reveal className="simpleIntro"><Link className="backLink" href="/"><ArrowLeft size={17} />Voltar ao início</Link><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></Reveal>
      <Reveal className="simpleContent" delay={0.08}>{children}</Reveal>
    </main>
  );
}
