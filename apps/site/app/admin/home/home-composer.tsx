"use client";

import { ArrowDown } from "@phosphor-icons/react/ArrowDown";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

type HomeSection = Readonly<{ id: string; name: string; detail: string; status: string }>;
type Feedback = Readonly<{ kind: "success" | "error"; message: string }>;

const initialSections: readonly HomeSection[] = [
  { id: "home_hero", name: "Artigos em destaque", detail: "Carrossel com até quatro artigos publicados", status: "Ativo" },
  { id: "home_latest", name: "Agora no Blog", detail: "Três artigos com maior prioridade editorial", status: "Curadoria" },
  { id: "home_categories", name: "Categorias", detail: "Navegação agrupada por missão do leitor", status: "Curadoria" },
  { id: "home_store", name: "Loja da comunidade", detail: "Chaveiro e miniatura 3D", status: "Demo" },
  { id: "home_popular", name: "Leituras em destaque", detail: "Ranking editorial sem analytics real", status: "Curadoria" },
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
  return "Não foi possível salvar a composição.";
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    console.error("A resposta da composição não pôde ser interpretada.", error);
    return null;
  }
}

function orderedSections(value: unknown): readonly HomeSection[] {
  if (!isRecord(value) || !Array.isArray(value.sections)) return initialSections;
  const ids = value.sections.flatMap((section) => isRecord(section) && typeof section.id === "string" ? [section.id] : []);
  const ordered = ids.flatMap((id) => initialSections.filter((section) => section.id === id));
  return ordered.length === initialSections.length ? ordered : initialSections;
}

async function loadSections(): Promise<readonly HomeSection[]> {
  const response = await fetch("/api/admin/home", { credentials: "same-origin", headers: { Accept: "application/json" } });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(apiError(payload));
  return orderedSections(payload);
}

function FeedbackMessage({ feedback }: Readonly<{ feedback: Feedback | null }>): ReactElement | null {
  if (!feedback) return null;
  const style = feedback.kind === "error" ? { color: "#ffaaaa" } : undefined;
  return <span className="mockFeedback" role={feedback.kind === "error" ? "alert" : "status"} style={style}>{feedback.message}</span>;
}

export function HomeComposer(): ReactElement {
  const [sections, setSections] = useState<readonly HomeSection[]>(initialSections);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;
    loadSections().then((loaded) => { if (active) setSections(loaded); }).catch((error: unknown) => {
      console.error("Falha ao carregar composição da home.", error);
      if (active) setFeedback({ kind: "error", message: "A ordem salva não pôde ser carregada." });
    });
    return () => { active = false; };
  }, []);

  function move(index: number, offset: number): void {
    setSections((current) => moveItem(current, index, offset));
    setDirty(true); setFeedback(null);
  }

  function restore(): void {
    setSections(initialSections); setDirty(true); setFeedback(null);
  }

  async function save(): Promise<void> {
    setSaving(true); setFeedback(null);
    try {
      const response = await fetch("/api/admin/home", {
        method: "PUT", credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sections.map((section) => ({ id: section.id })) }),
      });
      const payload = await responsePayload(response);
      if (!response.ok) throw new Error(apiError(payload));
      setDirty(false); setFeedback({ kind: "success", message: "Composição salva e registrada no CMS." });
    } catch (error) {
      console.error("Falha ao salvar composição da home.", error);
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível salvar a composição." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adminCard"><div className="adminObjectList">{sections.map((section, index) => <article className="adminQueueItem" key={section.id}><span className="adminQueueIndex">{String(index + 1).padStart(2, "0")}</span><div><h3>{section.name}</h3><p>{section.detail} · {section.status}</p></div><div className="adminRowActions"><button type="button" style={{ width: 44, height: 44 }} aria-label={`Mover ${section.name} para cima`} disabled={index === 0 || saving} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button type="button" style={{ width: 44, height: 44 }} aria-label={`Mover ${section.name} para baixo`} disabled={index === sections.length - 1 || saving} onClick={() => move(index, 1)}><ArrowDown size={17} /></button></div></article>)}</div><div className="adminFormActions"><button className="adminButton adminButton--secondary" type="button" disabled={saving} onClick={restore}>Restaurar ordem</button><button className="adminButton adminButton--primary" type="button" disabled={!dirty || saving} onClick={save}>{saving ? "Salvando…" : "Salvar composição"}</button><FeedbackMessage feedback={feedback} /></div></div>
  );
}
