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

function ArticleRow({ article }: Readonly<{ article: ArticleSummary }>): ReactElement {
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(article.updatedAt);
  return <article className="adminObjectRow"><div><h3>{article.title}</h3><p>{article.category} · versão {article.version} · {date}</p></div><div className="adminRowActions"><span className="adminStatus"><i aria-hidden="true" />{article.state}</span><Link className="adminTextLink" href={`/admin/artigos/novo?article=${encodeURIComponent(article.id)}`}>Criar revisão</Link></div></article>;
}

export function ArticlesManager(): ReactElement {
  const [articles, setArticles] = useState<readonly ArticleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadArticles().then((items) => { if (active) setArticles(items); }).catch((reason: unknown) => {
      console.error("Falha ao carregar artigos do CMS.", reason);
      if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar os artigos.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="adminEmpty" role="status"><strong>Carregando artigos…</strong></div>;
  if (error) return <div className="adminEmpty" role="alert"><strong>{error}</strong></div>;
  if (!articles.length) return <div className="adminEmpty"><strong>Nenhum artigo no CMS</strong><p>Crie o primeiro rascunho a partir de um vídeo.</p></div>;
  return <div className="adminObjectList">{articles.map((article) => <ArticleRow article={article} key={article.id} />)}</div>;
}
