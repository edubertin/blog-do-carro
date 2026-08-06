import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { Info } from "@phosphor-icons/react/dist/ssr/Info";
import type { ReactElement, ReactNode } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import type { MockStatus } from "./admin-data";
import { statusLabels } from "./admin-data";

type HeaderProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}>;

export function AdminPageHeader(props: HeaderProps): ReactElement {
  return (
    <header className="adminPageHeader">
      <div><span className="adminEyebrow">{props.eyebrow}</span><h1>{props.title}</h1><p>{props.description}</p></div>
      {props.action ? <div className="adminPageAction">{props.action}</div> : null}
    </header>
  );
}

export function DemoBanner(): ReactElement {
  return (
    <div className="adminDemoBanner" role="note">
      <Info size={20} weight="fill" aria-hidden="true" />
      <div><strong>Demonstração local</strong><span>Nenhuma alteração é salva. Não cole senhas, tokens, chaves ou dados reais.</span></div>
    </div>
  );
}

export function StatusPill({ status }: { status: MockStatus }): ReactElement {
  return <span className={`adminStatus adminStatus--${status}`}><i aria-hidden="true" />{statusLabels[status]}</span>;
}

type CardProps = Readonly<{
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
}>;

export function AdminCard({ children, className = "", title, eyebrow }: CardProps): ReactElement {
  return (
    <section className={`adminCard ${className}`.trim()}>
      {eyebrow || title ? <header className="adminCardHeader">{eyebrow ? <span>{eyebrow}</span> : null}{title ? <h2>{title}</h2> : null}</header> : null}
      {children}
    </section>
  );
}

export function AdminTextLink({ href, children }: Readonly<{ href: string; children: ReactNode }>): ReactElement {
  return <Link className="adminTextLink" href={href}>{children}<ArrowRight size={17} weight="bold" aria-hidden="true" /></Link>;
}

type MetricProps = Readonly<{
  label: string;
  value: string;
  detail: string;
  tone?: "positive" | "brand" | "neutral" | "warning";
}>;

export function MetricCard({ label, value, detail, tone = "neutral" }: MetricProps): ReactElement {
  return <article className={`adminMetric adminMetric--${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function EmptyState({ title, text }: Readonly<{ title: string; text: string }>): ReactElement {
  return <div className="adminEmpty"><span aria-hidden="true">—</span><strong>{title}</strong><p>{text}</p></div>;
}
