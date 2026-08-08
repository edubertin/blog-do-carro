"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { AdminArticleSummary } from "@/db/admin-contracts";

type Revision = Readonly<{
  id: string;
  version: number;
  state: AdminArticleSummary["state"];
  createdAt: number;
  actor: string | null;
}>;

type Feedback = Readonly<{ kind: "success" | "error"; message: string }>;

type RevisionHistoryProps = Readonly<{
  article: AdminArticleSummary;
  onRestored: () => Promise<void>;
}>;

type HistoryState = Readonly<{
  revisions: readonly Revision[];
  selected: Revision | null;
  loading: boolean;
  restoring: boolean;
  feedback: Feedback | null;
  select: (revision: Revision | null) => void;
  restore: () => Promise<void>;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRevision(value: unknown): Revision | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.version !== "number") return null;
  const createdAt = parseDate(value.createdAt);
  const state = value.state;
  if (createdAt === null || (state !== "draft" && state !== "review" && state !== "scheduled" && state !== "published")) return null;
  const actor = typeof value.actor === "string" ? value.actor : typeof value.actorLabel === "string" ? value.actorLabel : null;
  return { id: value.id, version: value.version, state, createdAt, actor };
}

function parseRevisions(value: unknown): readonly Revision[] {
  if (!isRecord(value) || !Array.isArray(value.revisions)) throw new Error("O CMS retornou um histórico inválido.");
  return value.revisions.flatMap((item) => {
    const revision = parseRevision(item);
    return revision ? [revision] : [];
  });
}

function stateLabel(state: Revision["state"]): string {
  if (state === "draft") return "Rascunho";
  if (state === "review") return "Em revisão";
  if (state === "scheduled") return "Agendado";
  return "Publicado";
}

function errorMessage(payload: unknown, fallback: string): string {
  return isRecord(payload) && typeof payload.error === "string" ? payload.error : fallback;
}

async function jsonPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    console.error("Não foi possível interpretar a resposta do histórico.", error);
    return null;
  }
}

async function loadRevisions(articleId: string): Promise<readonly Revision[]> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(articleId)}/revisions`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = await jsonPayload(response);
  if (!response.ok) throw new Error(errorMessage(payload, "Não foi possível carregar o histórico."));
  return parseRevisions(payload);
}

async function restoreRevision(article: AdminArticleSummary, revisionId: string): Promise<void> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}/restore`, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ revisionId, expectedVersion: article.version }),
  });
  const payload = await jsonPayload(response);
  if (!response.ok) throw new Error(errorMessage(payload, "Não foi possível restaurar esta versão."));
}

function RevisionCard(props: Readonly<{
  revision: Revision;
  currentRevisionId: string;
  selected: boolean;
  busy: boolean;
  onSelect: (revision: Revision) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}>): ReactElement {
  const { revision } = props;
  const current = revision.id === props.currentRevisionId;
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(revision.createdAt);
  return (
    <li className={`adminRevisionCard${current ? " adminRevisionCard--current" : ""}`}>
      <div className="adminRevisionHeading">
        <div><strong>Versão {revision.version}</strong><span className="adminRevisionState">{stateLabel(revision.state)}</span></div>
        {current ? <span className="adminRevisionCurrent">Atual</span> : null}
      </div>
      <p><time dateTime={new Date(revision.createdAt).toISOString()}>{date}</time>{revision.actor ? <> · {revision.actor}</> : null}</p>
      {!current ? <button className="adminButton adminButton--secondary" type="button" disabled={props.busy} aria-expanded={props.selected} onClick={() => props.onSelect(revision)}>Restaurar esta versão</button> : null}
      {props.selected ? <RestoreConfirmation revision={revision} busy={props.busy} onCancel={props.onCancel} onConfirm={props.onConfirm} /> : null}
    </li>
  );
}

function useRevisionHistory(article: AdminArticleSummary, onRestored: () => Promise<void>): HistoryState {
  const [revisions, setRevisions] = useState<readonly Revision[]>([]);
  const [selected, setSelected] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;
    loadRevisions(article.id).then((items) => {
      if (active) setRevisions(items);
    }).catch((error: unknown) => {
      console.error("Falha ao carregar histórico editorial.", error);
      if (active) setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível carregar o histórico." });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [article.id, article.version]);

  async function restore(): Promise<void> {
    if (!selected) return;
    setRestoring(true);
    setFeedback(null);
    try {
      await restoreRevision(article, selected.id);
      await onRestored();
      setSelected(null);
      setFeedback({ kind: "success", message: `Versão ${selected.version} restaurada e publicada.` });
    } catch (error) {
      console.error("Falha ao restaurar revisão editorial.", error);
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível restaurar esta versão." });
    } finally {
      setRestoring(false);
    }
  }

  return { revisions, selected, loading, restoring, feedback, select: setSelected, restore };
}

function RestoreConfirmation(props: Readonly<{ revision: Revision; busy: boolean; onCancel: () => void; onConfirm: () => Promise<void> }>): ReactElement {
  return <div className="adminRestoreConfirm" role="alertdialog" aria-labelledby="restore-title" aria-describedby="restore-description">
    <div><strong id="restore-title">Restaurar e publicar a versão {props.revision.version}?</strong><p id="restore-description">Esta versão substituirá imediatamente o conteúdo público atual. O histórico continuará disponível.</p></div>
    <div className="adminRestoreActions"><button className="adminButton adminButton--secondary" type="button" disabled={props.busy} onClick={props.onCancel}>Cancelar</button><button className="adminButton adminButton--danger" type="button" disabled={props.busy} onClick={() => void props.onConfirm()}>{props.busy ? "Restaurando…" : "Confirmar restauração"}</button></div>
  </div>;
}

export function RevisionHistory({ article, onRestored }: RevisionHistoryProps): ReactElement {
  const history = useRevisionHistory(article, onRestored);

  return (
    <section className="adminRevisionHistory" aria-labelledby="revision-history-title" aria-busy={history.loading || history.restoring}>
      <div className="adminRevisionIntro">
        <div><span>Histórico editorial</span><h2 id="revision-history-title">Versões do artigo</h2></div>
        <p>Ao restaurar, a versão escolhida substitui imediatamente o conteúdo público atual.</p>
      </div>
      {history.loading ? <div className="adminRevisionEmpty" role="status">Carregando versões…</div> : null}
      {!history.loading && history.revisions.length === 0 && !history.feedback ? <div className="adminRevisionEmpty">Nenhuma versão anterior disponível.</div> : null}
      {history.revisions.length > 0 ? <ol className="adminRevisionList">{history.revisions.map((revision) => <RevisionCard key={revision.id} revision={revision} currentRevisionId={article.revisionId} selected={history.selected?.id === revision.id} busy={history.restoring} onSelect={history.select} onCancel={() => history.select(null)} onConfirm={history.restore} />)}</ol> : null}
      {history.feedback ? <div className="mockFeedback" role={history.feedback.kind === "error" ? "alert" : "status"}>{history.feedback.message}</div> : null}
    </section>
  );
}
