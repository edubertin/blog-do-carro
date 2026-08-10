"use client";

import { Article } from "@phosphor-icons/react/Article";
import { ArrowSquareOut } from "@phosphor-icons/react/ArrowSquareOut";
import { ChartLineUp } from "@phosphor-icons/react/ChartLineUp";
import { Gauge } from "@phosphor-icons/react/Gauge";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { House } from "@phosphor-icons/react/House";
import { List } from "@phosphor-icons/react/List";
import { Package } from "@phosphor-icons/react/Package";
import { PlugsConnected } from "@phosphor-icons/react/PlugsConnected";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { ShoppingCart } from "@phosphor-icons/react/ShoppingCart";
import { SignOut } from "@phosphor-icons/react/SignOut";
import { Storefront } from "@phosphor-icons/react/Storefront";
import { X } from "@phosphor-icons/react/X";
import { UsersThree } from "@phosphor-icons/react/UsersThree";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import { BrandLogo } from "@/app/components/brand-logo";
import { DemoBanner } from "./admin-ui";

type NavItem = Readonly<{ label: string; href: string; icon: ReactElement }>;
type NavGroup = Readonly<{ label: string; items: readonly NavItem[] }>;

const navGroups: readonly NavGroup[] = [
  { label: "Visão geral", items: [
    { label: "Central", href: "/admin", icon: <Gauge size={20} /> },
    { label: "Analytics", href: "/admin/analytics", icon: <ChartLineUp size={20} /> },
    { label: "Audiência", href: "/admin/audiencia", icon: <UsersThree size={20} /> },
  ] },
  { label: "Conteúdo", items: [
    { label: "Artigos", href: "/admin/artigos", icon: <Article size={20} /> },
    { label: "Página inicial", href: "/admin/home", icon: <House size={20} /> },
    { label: "Menu e categorias", href: "/admin/menu", icon: <List size={20} /> },
  ] },
  { label: "Loja", items: [
    { label: "Produtos", href: "/admin/loja/produtos", icon: <Package size={20} /> },
    { label: "Pedidos", href: "/admin/pedidos", icon: <ShoppingCart size={20} /> },
    { label: "Configurações", href: "/admin/loja/configuracoes", icon: <Storefront size={20} /> },
  ] },
  { label: "Sistema", items: [
    { label: "Conexões", href: "/admin/integracoes", icon: <PlugsConnected size={20} /> },
    { label: "E-mails", href: "/admin/emails", icon: <EnvelopeSimple size={20} /> },
    { label: "Segurança", href: "/admin/seguranca", icon: <ShieldCheck size={20} /> },
  ] },
];

const mobileItems = [navGroups[0].items[0], navGroups[1].items[0], navGroups[2].items[0], navGroups[2].items[1], navGroups[3].items[0]];
const drawerFocusable = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

function setAdminBackgroundAccessibility(hidden: boolean): void {
  document.querySelectorAll<HTMLElement>(".adminMain, .adminBottomNav, .adminMobileHeader").forEach((element) => {
    element.inert = hidden;
    if (hidden) element.setAttribute("aria-hidden", "true");
    else element.removeAttribute("aria-hidden");
  });
}

function trapDrawerTab(event: KeyboardEvent, drawer: HTMLElement): void {
  if (event.key !== "Tab") return;
  const focusable = [...drawer.querySelectorAll<HTMLElement>(drawerFocusable)];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function isCurrentPath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({ item, pathname, onNavigate }: Readonly<{ item: NavItem; pathname: string; onNavigate?: () => void }>): ReactElement {
  const active = isCurrentPath(pathname, item.href);
  return <Link className={active ? "adminNavLink isActive" : "adminNavLink"} href={item.href} aria-current={active ? "page" : undefined} onClick={onNavigate}>{item.icon}<span>{item.label}</span></Link>;
}

function NavigationGroups({ pathname, onNavigate }: Readonly<{ pathname: string; onNavigate?: () => void }>): ReactElement {
  return <nav className="adminNavigation" aria-label="Painel administrativo">{navGroups.map((group) => <div className="adminNavGroup" key={group.label}><span>{group.label}</span>{group.items.map((item) => <NavigationLink item={item} pathname={pathname} onNavigate={onNavigate} key={item.href} />)}</div>)}</nav>;
}

function AdminBrand(): ReactElement {
  return <Link className="adminBrand" href="/admin" aria-label="Central Blog do Carro"><BrandLogo eager /><span className="adminBrandLabel">Central</span></Link>;
}

type SessionProps = Readonly<{
  displayName: string;
  exitHref: string;
  localPreview: boolean;
  onNavigate?: () => void;
}>;

function AdminSession({ displayName, exitHref, localPreview, onNavigate }: SessionProps): ReactElement {
  return (
    <div className="adminSession">
      <span>{localPreview ? "Prévia local · owner" : "Sessão ativa · owner"}</span>
      <strong>{displayName}</strong>
      <div>
        <Link href="/" onClick={onNavigate}><ArrowSquareOut size={18} />Ver portal</Link>
        <Link href={exitHref} onClick={onNavigate}><SignOut size={18} />Sair</Link>
      </div>
    </div>
  );
}

function DesktopSidebar(props: Readonly<{ pathname: string } & SessionProps>): ReactElement {
  return <aside className="adminSidebar"><AdminBrand /><NavigationGroups pathname={props.pathname} /><AdminSession {...props} /></aside>;
}

type MobileDrawerProps = Readonly<{
  open: boolean;
  pathname: string;
  onClose: () => void;
}> & SessionProps;

function MobileDrawer({ open, pathname, onClose, ...session }: MobileDrawerProps): ReactElement {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAdminBackgroundAccessibility(true);
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); else trapDrawerTab(event, drawer); };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); setAdminBackgroundAccessibility(false); returnTarget?.focus(); };
  }, [onClose, open]);
  return <div className="adminDrawerLayer" data-open={open} aria-hidden={!open}><button className="adminDrawerBackdrop" type="button" tabIndex={-1} aria-label="Fechar navegação" onClick={onClose} /><aside className="adminDrawer" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navegação administrativa"><div className="adminDrawerHeader"><AdminBrand /><button ref={closeRef} type="button" aria-label="Fechar menu" onClick={onClose}><X size={22} weight="bold" /></button></div><NavigationGroups pathname={pathname} onNavigate={onClose} /><AdminSession {...session} onNavigate={onClose} /></aside></div>;
}

function MobileHeader({ open, localPreview, onOpen }: Readonly<{ open: boolean; localPreview: boolean; onOpen: () => void }>): ReactElement {
  return <header className="adminMobileHeader"><AdminBrand /><div><span>{localPreview ? "Prévia local" : "Owner"}</span><button type="button" aria-label="Abrir navegação administrativa" aria-expanded={open} onClick={onOpen}><List size={23} weight="bold" /></button></div></header>;
}

function MobileNavigation({ pathname }: { pathname: string }): ReactElement {
  return <nav className="adminBottomNav" aria-label="Atalhos administrativos">{mobileItems.map((item) => <NavigationLink item={item} pathname={pathname} key={item.href} />)}</nav>;
}

type AdminShellProps = Readonly<{
  children: ReactNode;
  displayName: string;
  exitHref: string;
  localPreview: boolean;
}>;

export function AdminShell({ children, displayName, exitHref, localPreview }: AdminShellProps): ReactElement {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const session = { displayName, exitHref, localPreview };
  return (
    <div className="adminShell">
      <a className="adminSkipLink" href="#admin-content">Pular para o conteúdo</a>
      <DesktopSidebar pathname={pathname} {...session} />
      <MobileHeader open={drawerOpen} localPreview={localPreview} onOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} pathname={pathname} onClose={() => setDrawerOpen(false)} {...session} />
      <main className="adminMain" id="admin-content"><DemoBanner localPreview={localPreview} />{children}</main>
      <MobileNavigation pathname={pathname} />
    </div>
  );
}
