"use client";

import { ArrowDown } from "@phosphor-icons/react/ArrowDown";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

type MenuItem = Readonly<{ label: string; href: string; visible: boolean }>;
type Feedback = Readonly<{ kind: "success" | "error"; message: string }>;

const initialItems: readonly MenuItem[] = [
  { label: "Início", href: "/", visible: true },
  { label: "Artigos", href: "/#ultimos", visible: true },
  { label: "Categorias", href: "/#categorias", visible: true },
  { label: "Loja", href: "/loja", visible: true },
  { label: "Sobre", href: "/sobre", visible: true },
  { label: "Contato", href: "/contato", visible: true },
  { label: "Marketplace", href: "/marketplace", visible: false },
];

function moveItem<T>(items: readonly T[], index: number, offset: number): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  const current = next[index];
  const replacement = next[target];
  if (current === undefined || replacement === undefined) return next;
  next[index] = replacement;
  next[target] = current;
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function apiError(value: unknown): string {
  if (isRecord(value) && typeof value.error === "string") return value.error;
  return "Não foi possível salvar o menu.";
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    console.error("A resposta do menu não pôde ser interpretada.", error);
    return null;
  }
}

async function saveMenu(items: readonly MenuItem[]): Promise<void> {
  const response = await fetch("/api/admin/menu", {
    method: "PUT", credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ items: items.map((item) => ({ label: item.label, href: item.href, active: item.visible })) }),
  });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(apiError(payload));
}

function menuItems(value: unknown): readonly MenuItem[] {
  if (!isRecord(value) || !Array.isArray(value.items)) return initialItems;
  const parsed = value.items.flatMap((item) => {
    if (!isRecord(item) || typeof item.label !== "string" || typeof item.href !== "string" || typeof item.active !== "boolean") return [];
    return [{ label: item.label, href: item.href, visible: item.active }];
  });
  return parsed.length ? parsed : initialItems;
}

async function loadMenu(): Promise<readonly MenuItem[]> {
  const response = await fetch("/api/admin/menu", { credentials: "same-origin", headers: { Accept: "application/json" } });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(apiError(payload));
  return menuItems(payload);
}

type MenuRowProps = Readonly<{
  item: MenuItem;
  index: number;
  lastIndex: number;
  saving: boolean;
  onToggle: (href: string) => void;
  onMove: (index: number, offset: number) => void;
}>;

function MenuRow(props: MenuRowProps): ReactElement {
  const toggleClass = props.item.visible ? "adminToggle isOn" : "adminToggle";
  return (
    <article className="adminObjectRow"><div><h3>{props.item.label}</h3><p>{props.item.href}</p></div><div style={{ display: "grid", gap: 8, justifyItems: "end" }}><button className={toggleClass} style={{ minHeight: 44 }} type="button" role="switch" aria-checked={props.item.visible} disabled={props.saving} onClick={() => props.onToggle(props.item.href)}><span aria-hidden="true" /><b>{props.item.visible ? "Visível" : "Oculto"}</b></button><div className="adminRowActions"><button type="button" style={{ width: 44, height: 44 }} aria-label={`Mover ${props.item.label} para cima`} disabled={props.index === 0 || props.saving} onClick={() => props.onMove(props.index, -1)}><ArrowUp size={17} /></button><button type="button" style={{ width: 44, height: 44 }} aria-label={`Mover ${props.item.label} para baixo`} disabled={props.index === props.lastIndex || props.saving} onClick={() => props.onMove(props.index, 1)}><ArrowDown size={17} /></button></div></div></article>
  );
}

function FeedbackMessage({ feedback }: Readonly<{ feedback: Feedback | null }>): ReactElement | null {
  if (!feedback) return null;
  const style = feedback.kind === "error" ? { color: "#ffaaaa" } : undefined;
  return <span className="mockFeedback" role={feedback.kind === "error" ? "alert" : "status"} style={style}>{feedback.message}</span>;
}

export function MenuComposer(): ReactElement {
  const [items, setItems] = useState<readonly MenuItem[]>(initialItems);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;
    loadMenu().then((loaded) => { if (active) setItems(loaded); }).catch((error: unknown) => {
      console.error("Falha ao carregar menu principal.", error);
      if (active) setFeedback({ kind: "error", message: "O menu salvo não pôde ser carregado." });
    });
    return () => { active = false; };
  }, []);

  function change(next: readonly MenuItem[]): void {
    setItems(next); setDirty(true); setFeedback(null);
  }

  function toggleItem(href: string): void {
    change(items.map((item) => item.href === href ? { ...item, visible: !item.visible } : item));
  }

  function move(index: number, offset: number): void {
    change(moveItem(items, index, offset));
  }

  async function save(): Promise<void> {
    setSaving(true); setFeedback(null);
    try {
      await saveMenu(items);
      setDirty(false); setFeedback({ kind: "success", message: "Menu salvo e disponível para a navegação pública." });
    } catch (error) {
      console.error("Falha ao salvar menu principal.", error);
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível salvar o menu." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adminCard"><div className="adminObjectList">{items.map((item, index) => <MenuRow item={item} index={index} lastIndex={items.length - 1} saving={saving} onToggle={toggleItem} onMove={move} key={item.href} />)}</div><div className="adminFormActions"><button className="adminButton adminButton--secondary" type="button" disabled={saving} onClick={() => change(initialItems)}>Restaurar padrão</button><button className="adminButton adminButton--primary" type="button" disabled={!dirty || saving} onClick={save}>{saving ? "Salvando…" : "Salvar menu"}</button><FeedbackMessage feedback={feedback} /></div></div>
  );
}
