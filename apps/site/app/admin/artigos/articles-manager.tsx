"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";

type ArticleSummary = Readonly<{
  id: string;
  title: string;
  category: string;
  state: string;
  version: number;
  updatedAt: number;
}>;

function stateLabel(state: string): string {
  if (state === "draft") return "Rascunho";
  if (state === "review") return "Em revisão";
  if (state === "scheduled") return "Agendado";
  if (state === "published") return "Publicado";
  return state;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseArticle(value: unknown): ArticleSummary | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string" || typeof value.category !== "string") return null;
  if (typeof value.state !== "string" || typeof value.version !== "number" || typeof value.updatedAt !== "number") return null;
  return { id: value.id, title: value.title, category: value.category, state: value.state, version: value.version, updatedAt: value.updatedAt };
}

async function loadArticles(): Promise<readonly ArticleSummary[]> {
  const response = await fetch("/api/admin/articles", { credentials: "same-origin", headers: { Accept: "application/json" } });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(isRecord(payload) && typeof payload.error === "string" ? payload.error : "Não foi possível carregar os artigos.");
  if (!isRecord(payload) || !Array.isArray(payload.articles)) return [];
  return payload.articles.flatMap((article) => { const parsed = parseArticle(article); return parsed ? [parsed] : []; });
}

async function archiveArticle(id: string): Promise<void> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE", credentials: "same-origin", headers: { Accept: "application/json" },
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(isRecord(payload) && typeof payload.error === "string" ? payload.error : "Não foi possível remover o artigo.");
}

type ArticleRowProps = Readonly<{ article: ArticleSummary; busy: boolean; onRemove: (article: ArticleSummary) => void }>;

function ArticleRow({ article, busy, onRemove }: ArticleRowProps): ReactElement {
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(article.updatedAt);
  return <article className="adminObjectRow"><div><h3>{article.title}</h3><p>{article.category} · versão {article.version} · <time dateTime={new Date(article.updatedAt).toISOString()}>{date}</time></p></div><div className="adminRowActions"><span className="adminStatus"><i aria-hidden="true" />{stateLabel(article.state)}</span><Link className="adminTextLink" href={`/admin/artigos/novo?article=${encodeURIComponent(article.id)}`}>Editar artigo</Link><button className="adminButton adminButton--danger" type="button" aria-label={`Remover artigo ${article.title}`} disabled={busy} onClick={() => onRemove(article)}>{busy ? "Removendo…" : "Remover artigo"}</button></div></article>;
}

export function ArticlesManager(): ReactElement {
  const [articles, setArticles] = useState<readonly ArticleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadArticles().then((items) => { if (active) setArticles(items); }).catch((reason: unknown) => {
      console.error("Falha ao carregar artigos do CMS.", reason);
      if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar os artigos.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function removeArticle(article: ArticleSummary): Promise<void> {
    if (!window.confirm(`Remover “${article.title}” do portal? O histórico ficará arquivado.`)) return;
    setRemovingId(article.id); setFeedback(null);
    try {
      await archiveArticle(article.id);
      setArticles((current) => current.filter((item) => item.id !== article.id));
      setFeedback(`${article.title} foi removido do portal e arquivado.`);
    } catch (reason) {
      console.error("Falha ao arquivar artigo do CMS.", reason);
      setError(reason instanceof Error ? reason.message : "Não foi possível remover o artigo.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <div className="adminEmpty" role="status"><strong>Carregando artigos…</strong></div>;
  if (error) return <div className="adminEmpty" role="alert"><strong>{error}</strong></div>;
  if (!articles.length) return <>{feedback ? <div className="mockFeedback" role="status">{feedback}</div> : null}<div className="adminEmpty"><strong>Nenhum artigo no CMS</strong><p>Crie o primeiro rascunho a partir de um vídeo.</p></div></>;
  return <>{feedback ? <div className="mockFeedback" role="status">{feedback}</div> : null}<div className="adminObjectList">{articles.map((article) => <ArticleRow article={article} busy={removingId === article.id} key={article.id} onRemove={removeArticle} />)}</div></>;
}
