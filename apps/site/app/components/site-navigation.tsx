"use client";

import { House } from "@phosphor-icons/react/House";
import { List } from "@phosphor-icons/react/List";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { SquaresFour } from "@phosphor-icons/react/SquaresFour";
import { X } from "@phosphor-icons/react/X";
import { SiteLink as Link } from "@/app/components/site-link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement, RefObject } from "react";
import { CartLink } from "@/app/commerce/cart-link";
import type {
  NavigationProjection,
  PublicCategory,
  PublicSearchDocument,
} from "@/domain/public-content";
import { BrandLogo } from "./brand-logo";

type CloseHandler = { onClose: () => void };
type SearchPanelProps = CloseHandler & { open: boolean };
type DrawerProps = CloseHandler & {
  open: boolean;
  categories: readonly PublicCategory[];
  items: NavigationProjection["items"];
};

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

function setPageAccessibility(hidden: boolean): void {
  const elements = document.querySelectorAll<HTMLElement>("main, .siteFooter, .siteHeader, .bottomNav");
  elements.forEach((element) => {
    element.inert = hidden;
    if (hidden) element.setAttribute("aria-hidden", "true");
    else element.removeAttribute("aria-hidden");
  });
}

function trapTabKey(event: KeyboardEvent, panel: HTMLElement): void {
  if (event.key !== "Tab") return;
  const focusable = [...panel.querySelectorAll<HTMLElement>(focusableSelector)];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const outside = !panel.contains(document.activeElement);
  if (outside || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function useOverlayAccessibility(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>, initialFocusRef?: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPageAccessibility(true);
    (initialFocusRef?.current ?? panel.querySelector<HTMLElement>(focusableSelector) ?? panel).focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else trapTabKey(event, panel);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      setPageAccessibility(false);
      returnTarget?.focus();
    };
  }, [initialFocusRef, onClose, open, panelRef]);
}

type IconButtonProps = Readonly<{
  label: string;
  onClick: () => void;
  kind: "menu" | "search";
  controls: string;
  expanded: boolean;
}>;

function IconButton(props: IconButtonProps): ReactElement {
  const Icon = props.kind === "menu" ? List : MagnifyingGlass;
  return (
    <button className="iconButton" type="button" aria-label={props.label} aria-controls={props.controls} aria-expanded={props.expanded} onClick={props.onClick}>
      <Icon size={23} weight="bold" aria-hidden="true" />
    </button>
  );
}

function MenuDrawer({ open, onClose, categories, items }: DrawerProps): ReactElement {
  const panelRef = useRef<HTMLElement>(null);
  useOverlayAccessibility(open, onClose, panelRef);
  return (
    <div className="sheetLayer" data-open={open} aria-hidden={!open}>
      <button className="sheetBackdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <aside className="menuDrawer" id="main-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu principal" tabIndex={-1}>
        <div className="sheetHeader">
          <span className="eyebrow">NAVEGAÇÃO</span>
          <button className="closeButton" type="button" aria-label="Fechar menu" onClick={onClose}>
            <X size={22} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <nav className="drawerLinks">{items.map((item) => <Link href={item.href} onClick={onClose} key={item.href}>{item.label}</Link>)}</nav>
        <p className="drawerLabel">Categorias</p>
        <div className="drawerCategories">{categories.map((category) => <Link href={`/categoria/${category.slug}`} onClick={onClose} key={category.slug}>{category.name}</Link>)}</div>
      </aside>
    </div>
  );
}

type SearchStatus = "idle" | "loading" | "ready" | "error";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSearchDocument(value: unknown): value is PublicSearchDocument {
  if (!isRecord(value)) return false;
  return ["slug", "category", "title", "subtitle"].every((key) => key in value && typeof value[key] === "string");
}

function searchDocuments(value: unknown): readonly PublicSearchDocument[] | null {
  if (!isRecord(value) || !("results" in value)) return null;
  const results = value.results;
  return Array.isArray(results) && results.every(isSearchDocument) ? results : null;
}

function SearchResults(props: Readonly<{ results: readonly PublicSearchDocument[]; status: SearchStatus; query: string; onClose: () => void }>): ReactElement {
  return (
    <div className="searchResults">
      {props.status === "loading" ? <p role="status">Buscando artigos publicados…</p> : null}
      {props.status === "error" ? <p role="alert">A busca ficou indisponível. Tente novamente.</p> : null}
      {props.results.map((article) => (
        <Link href={`/artigos/${article.slug}`} onClick={props.onClose} key={article.slug}>
          <span>{article.category}</span><strong>{article.title}</strong>
        </Link>
      ))}
      {props.status === "ready" && props.query.trim().length >= 2 && !props.results.length ? <p>Nenhum artigo encontrado. Tente outro termo.</p> : null}
    </div>
  );
}

type PublishedSearchState = Readonly<{
  results: readonly PublicSearchDocument[];
  status: SearchStatus;
}>;

function usePublishedSearch(query: string, suggestions: readonly PublicSearchDocument[]): PublishedSearchState {
  const [results, setResults] = useState<readonly PublicSearchDocument[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [settledQuery, setSettledQuery] = useState("");
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/public/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const payload: unknown = await response.json();
        const parsed = response.ok ? searchDocuments(payload) : null;
        if (!parsed) throw new Error("Resposta inválida da busca pública.");
        setResults(parsed);
        setStatus("ready");
        setSettledQuery(term);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("A busca pública falhou.", error);
        setResults([]);
        setStatus("error");
        setSettledQuery(term);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, suggestions]);
  const term = query.trim();
  if (term.length < 2) return { results: suggestions, status: "idle" };
  if (settledQuery !== term) return { results: [], status: "loading" };
  return { results, status };
}

type SearchPanelWithDataProps = SearchPanelProps & { suggestedArticles: readonly PublicSearchDocument[] };

function SearchPanel({ open, onClose, suggestedArticles }: SearchPanelWithDataProps): ReactElement {
  const [query, setQuery] = useState("");
  const search = usePublishedSearch(query, suggestedArticles);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayAccessibility(open, onClose, panelRef, inputRef);

  return (
    <div className="searchLayer" data-open={open} aria-hidden={!open}>
      <div className="searchPanel" id="site-search" ref={panelRef} role="dialog" aria-modal="true" aria-label="Buscar no Blog" tabIndex={-1}>
        <div className="sheetHeader"><span className="eyebrow">BUSCAR NO BLOG</span><button className="closeButton" type="button" aria-label="Fechar busca" onClick={onClose}><X size={22} weight="bold" /></button></div>
        <label className="searchField">
          <MagnifyingGlass size={21} aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite modelo, categoria ou assunto" />
        </label>
        <SearchResults results={search.results} status={search.status} query={query} onClose={onClose} />
      </div>
    </div>
  );
}

function BottomNav({ onSearch }: { onSearch: () => void }): ReactElement {
  const pathname = usePathname();
  return (
    <nav className="bottomNav" aria-label="Navegação rápida">
      <Link className={pathname === "/" ? "active" : ""} href="/"><House size={21} weight="fill" /><span>Início</span></Link>
      <CartLink />
      <Link href="/#categorias"><SquaresFour size={21} /><span>Categorias</span></Link>
      <button type="button" onClick={onSearch}><MagnifyingGlass size={21} /><span>Buscar</span></button>
    </nav>
  );
}

export function SiteNavigation({ navigation }: Readonly<{ navigation: NavigationProjection }>): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openMenu = useCallback(() => { setSearchOpen(false); setMenuOpen(true); }, []);
  const openSearch = useCallback(() => { setMenuOpen(false); setSearchOpen(true); }, []);
  return (
    <>
      <header className="siteHeader">
        <div className="headerInner">
          <IconButton kind="menu" label="Abrir menu" controls="main-menu" expanded={menuOpen} onClick={openMenu} />
          <Link href="/" aria-label="Blog do Carro — início"><BrandLogo eager /></Link>
          <div className="headerActions"><IconButton kind="search" label="Abrir busca" controls="site-search" expanded={searchOpen} onClick={openSearch} /><CartLink compact /></div>
        </div>
      </header>
      <MenuDrawer open={menuOpen} onClose={closeMenu} categories={navigation.categories} items={navigation.items} />
      <SearchPanel open={searchOpen} onClose={closeSearch} suggestedArticles={navigation.suggestedArticles} />
      <BottomNav onSearch={openSearch} />
    </>
  );
}
