"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import type { AdminArticleEditorRecord, AdminArticleSummary, ArticleDraftInput } from "@/db/admin-contracts";
import { AdminCard } from "../../admin-ui";

type Feedback = Readonly<{ kind: "success" | "error"; message: string }>;
type EditorPhase = "editing" | "saving" | "ready" | "reviewing" | "review" | "publishing" | "published";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArticleState(value: unknown): value is AdminArticleSummary["state"] {
  return value === "draft" || value === "review" || value === "scheduled" || value === "published";
}

function isArticle(value: unknown): value is AdminArticleSummary {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.revisionId === "string"
    && typeof value.slug === "string" && typeof value.title === "string"
    && typeof value.category === "string" && isArticleState(value.state)
    && typeof value.version === "number" && typeof value.updatedAt === "number";
}

function articleFromPayload(value: unknown): AdminArticleSummary | null {
  if (!isRecord(value) || !isArticle(value.article)) return null;
  return value.article;
}

function isDraft(value: unknown): value is ArticleDraftInput {
  if (!isRecord(value)) return false;
  return typeof value.title === "string" && typeof value.subtitle === "string" && typeof value.slug === "string"
    && typeof value.seoDescription === "string" && typeof value.categorySlug === "string" && Array.isArray(value.body)
    && typeof value.opinion === "string" && typeof value.imageUrl === "string" && typeof value.imageAlt === "string"
    && typeof value.youtubeVideoId === "string" && typeof value.readTimeMinutes === "number" && Array.isArray(value.faq);
}

function editorRecord(value: unknown): AdminArticleEditorRecord | null {
  if (!isRecord(value) || !isArticle(value.article) || !isDraft(value.draft)) return null;
  return { article: value.article, draft: value.draft };
}

function apiError(value: unknown, fallback: string): string {
  if (isRecord(value) && typeof value.error === "string") return value.error;
  return fallback;
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    console.error("A resposta do CMS não pôde ser interpretada.", error);
    return null;
  }
}

async function sendJson(url: string, body: unknown): Promise<Readonly<{ response: Response; payload: unknown }>> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, payload: await responsePayload(response) };
}

function formText(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function youtubeVideoId(value: string): string {
  const normalized = value.trim();
  if (/^[\w-]{6,20}$/u.test(normalized)) return normalized;
  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase().replace(/^www\./u, "");
    const pathId = url.pathname.match(/^\/(?:shorts|embed)\/([\w-]{6,20})/u)?.[1];
    const candidate = host === "youtu.be" ? url.pathname.slice(1).split("/")[0]
      : host === "youtube.com" || host === "m.youtube.com" ? url.searchParams.get("v") ?? pathId : null;
    if (candidate && /^[\w-]{6,20}$/u.test(candidate)) return candidate;
  } catch (error) {
    console.info("Origem do YouTube inválida informada no editor.", error);
  }
  throw new Error("Informe uma URL ou ID válido do YouTube.");
}

function imageSource(value: string): string {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..") && !value.includes("?") && !value.includes("#")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password) return url.toString();
  } catch (error) {
    console.info("Endereço de imagem inválido informado no editor.", error);
  }
  throw new Error("Informe um caminho interno ou uma URL HTTPS para a imagem.");
}

function articleDraft(form: HTMLFormElement, articleId?: string): ArticleDraftInput {
  const data = new FormData(form);
  const input: ArticleDraftInput = {
    articleId,
    title: formText(data, "title"), subtitle: formText(data, "subtitle"), slug: formText(data, "slug"),
    seoDescription: formText(data, "seoDescription"), categorySlug: formText(data, "categorySlug"),
    body: formText(data, "body").split(/\n\s*\n/u).map((item) => item.trim()).filter(Boolean),
    opinion: formText(data, "opinion"), imageUrl: imageSource(formText(data, "imageUrl")), imageAlt: formText(data, "imageAlt"),
    youtubeVideoId: youtubeVideoId(formText(data, "youtubeUrl")),
    readTimeMinutes: Number(formText(data, "readTimeMinutes")),
    faq: [{ question: formText(data, "faqQuestion"), answer: formText(data, "faqAnswer") }],
  };
  return input;
}

type DraftSectionProps = Readonly<{ draft: ArticleDraftInput | null }>;

function VideoSourceSection({ draft }: DraftSectionProps): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>1. Origem no YouTube</h2>
      <label className="adminField"><span>URL ou ID do vídeo</span><input name="youtubeUrl" required minLength={6} maxLength={300} inputMode="url" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://youtube.com/watch?v=..." defaultValue={draft?.youtubeVideoId ?? ""} aria-describedby="youtube-help" /><small id="youtube-help">Cole o link do vídeo que será a fonte do artigo.</small></label>
    </section>
  );
}

function EditorialSection({ draft }: DraftSectionProps): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>2. História editorial</h2>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Título</span><input name="title" required minLength={10} maxLength={180} autoComplete="off" placeholder="Título principal do artigo" defaultValue={draft?.title ?? ""} /></label>
        <label className="adminField"><span>Subtítulo</span><textarea name="subtitle" required minLength={20} maxLength={360} placeholder="Resuma o que o leitor encontrará" defaultValue={draft?.subtitle ?? ""} /></label>
        <div className="adminFieldGrid adminFieldGrid--two">
          <label className="adminField"><span>Categoria</span><select name="categorySlug" required defaultValue={draft?.categorySlug ?? ""}><option value="" disabled>Selecione uma categoria</option><option value="compra-e-venda">Compra e Venda</option><option value="negociacoes">Negociações</option><option value="mercado-automotivo">Mercado Automotivo</option><option value="suv">SUV</option><option value="sedan">Sedan</option><option value="hatch">Hatch</option><option value="picapes">Picapes</option><option value="comparativos">Comparativos</option><option value="problemas-cronicos">Problemas Crônicos</option><option value="dicas">Dicas</option></select></label>
          <label className="adminField"><span>Tempo de leitura em minutos</span><input name="readTimeMinutes" required type="number" min="1" max="120" step="1" inputMode="numeric" placeholder="6" defaultValue={draft?.readTimeMinutes ?? ""} /></label>
        </div>
        <label className="adminField"><span>Artigo completo</span><textarea name="body" required minLength={100} maxLength={200000} placeholder="Escreva o conteúdo do artigo" defaultValue={draft?.body.join("\n\n") ?? ""} aria-describedby="body-help" /><small id="body-help">Use uma linha em branco para separar os parágrafos.</small></label>
      </div>
    </section>
  );
}

function ImageSection({ draft }: DraftSectionProps): ReactElement {
  const [imageUrl, setImageUrl] = useState(draft?.imageUrl ?? "");
  const hasImage = imageUrl.trim().length > 0;

  return (
    <section className="adminFormSection">
      <h2>3. Imagem principal</h2>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Caminho ou URL HTTPS</span><input name="imageUrl" required maxLength={500} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="/images/artigos/capa.webp" value={imageUrl} onChange={(event) => setImageUrl(event.currentTarget.value)} aria-describedby="image-help" /><small id="image-help">A imagem precisa estar pública para o artigo poder ser publicado.</small></label>
        <label className="adminField"><span>Descrição acessível da imagem</span><input name="imageAlt" required minLength={5} maxLength={240} placeholder="Descreva o que aparece na imagem" defaultValue={draft?.imageAlt ?? ""} /></label>
      </div>
      <div className="adminMediaActions"><button className="adminButton adminButton--secondary" type="button" disabled={!hasImage} onClick={() => setImageUrl("")}>Remover arquivo</button></div>
    </section>
  );
}

function OpinionAndFaqSection({ draft }: DraftSectionProps): ReactElement {
  const faq = draft?.faq[0];
  return (
    <section className="adminFormSection">
      <h2>4. Opinião e FAQ</h2>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Minha opinião</span><textarea name="opinion" required minLength={20} maxLength={4000} placeholder="Parecer editorial do Blog do Carro" defaultValue={draft?.opinion ?? ""} /></label>
        <label className="adminField"><span>Pergunta frequente</span><input name="faqQuestion" required minLength={10} maxLength={300} placeholder="Dúvida que o artigo responde" defaultValue={faq?.question ?? ""} /></label>
        <label className="adminField"><span>Resposta</span><textarea name="faqAnswer" required minLength={10} maxLength={2000} placeholder="Resposta direta e objetiva" defaultValue={faq?.answer ?? ""} /></label>
      </div>
    </section>
  );
}

function SeoSection({ draft }: DraftSectionProps): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>5. Busca e compartilhamento</h2>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Endereço do artigo</span><input name="slug" required minLength={3} maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="titulo-do-artigo" defaultValue={draft?.slug ?? ""} aria-describedby="slug-help" /><small id="slug-help">Use somente letras minúsculas, números e hífens.</small></label>
        <label className="adminField"><span>Descrição para o Google</span><textarea name="seoDescription" required minLength={50} maxLength={180} placeholder="Resumo exibido nos resultados de busca" defaultValue={draft?.seoDescription ?? ""} /></label>
      </div>
    </section>
  );
}

function FeedbackMessage({ feedback }: Readonly<{ feedback: Feedback | null }>): ReactElement | null {
  if (!feedback) return null;
  const style = feedback.kind === "error" ? { color: "#ffaaaa" } : undefined;
  return <span className="mockFeedback" role={feedback.kind === "error" ? "alert" : "status"} style={style}>{feedback.message}</span>;
}

type DraftActionsProps = Readonly<{ phase: EditorPhase; feedback: Feedback | null }>;

function DraftActions({ phase, feedback }: DraftActionsProps): ReactElement {
  const saving = phase === "saving";
  return <div className="adminFormActions"><button className="adminButton adminButton--primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar rascunho"}</button><FeedbackMessage feedback={feedback} /></div>;
}

type WorkflowActionsProps = Readonly<{
  phase: EditorPhase;
  article: AdminArticleSummary;
  confirmed: boolean;
  feedback: Feedback | null;
  onConfirm: (confirmed: boolean) => void;
  onEdit: () => void;
  onReview: () => void;
  onPublish: () => void;
}>;

function WorkflowActions(props: WorkflowActionsProps): ReactElement {
  const busy = props.phase === "reviewing" || props.phase === "publishing";
  const inReview = props.phase === "review";
  const publishing = props.phase === "publishing";
  const published = props.phase === "published";
  const canPublish = inReview || publishing || published;
  return (
    <div className="adminFormSection">
      <h2>6. Revisão e publicação</h2><p>O rascunho “{props.article.title}” está salvo. Revise o conteúdo antes de enviá-lo para publicação.</p>
      {canPublish ? <label className="adminPublishConfirmation"><input type="checkbox" checked={props.confirmed} disabled={busy || published} onChange={(event) => props.onConfirm(event.currentTarget.checked)} /> Confirmo título, conteúdo, vídeo, imagem, SEO, opinião e FAQ.</label> : null}
      <div className="adminFormActions">
        {!published ? <button className="adminButton adminButton--secondary" type="button" disabled={busy || inReview} onClick={props.onEdit}>Editar conteúdo</button> : null}
        {!inReview && !published ? <button className="adminButton adminButton--primary" type="button" disabled={busy} onClick={props.onReview}>{props.phase === "reviewing" ? "Enviando…" : "Enviar para revisão"}</button> : null}
        {canPublish ? <button className="adminButton adminButton--primary" type="button" disabled={!props.confirmed || busy || published} onClick={props.onPublish}>{published ? "Artigo publicado" : publishing ? "Publicando…" : "Publicar artigo"}</button> : null}
        <FeedbackMessage feedback={props.feedback} />
      </div>
    </div>
  );
}

async function loadEditorRecord(articleId: string): Promise<AdminArticleEditorRecord> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(articleId)}`, { credentials: "same-origin", headers: { Accept: "application/json" } });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(apiError(payload, "Não foi possível carregar o artigo."));
  const record = editorRecord(payload);
  if (!record) throw new Error("O CMS retornou um artigo inválido.");
  return record;
}

export function ArticleEditor(): ReactElement {
  const [phase, setPhase] = useState<EditorPhase>("editing");
  const [article, setArticle] = useState<AdminArticleSummary | null>(null);
  const [initialDraft, setInitialDraft] = useState<ArticleDraftInput | null>(null);
  const [editingSaved, setEditingSaved] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [requestedArticleId] = useState(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("article"));
  const [loading, setLoading] = useState(requestedArticleId !== null);

  useEffect(() => {
    if (!requestedArticleId) return;
    let active = true;
    loadEditorRecord(requestedArticleId).then((record) => {
      if (!active) return;
      setArticle(record.article); setInitialDraft(record.draft); setPhase("editing");
    }).catch((error: unknown) => {
      console.error("Falha ao carregar artigo para revisão.", error);
      if (active) setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível carregar o artigo." });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestedArticleId]);

  async function createDraft(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setPhase("saving"); setFeedback(null);
    try {
      const result = await sendJson("/api/admin/articles", articleDraft(event.currentTarget, article?.id));
      if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível salvar o rascunho."));
      const saved = articleFromPayload(result.payload);
      if (!saved) throw new Error("O CMS retornou um rascunho inválido.");
      setArticle(saved); setEditingSaved(false); setPhase("ready"); setFeedback({ kind: "success", message: "Rascunho salvo. Revise e envie para aprovação." });
    } catch (error) {
      console.error("Falha ao criar rascunho editorial.", error);
      setPhase("editing"); setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível salvar o rascunho." });
    }
  }

  async function submitForReview(): Promise<void> {
    if (!article) return;
    setPhase("reviewing"); setFeedback(null);
    try {
      const result = await sendJson(`/api/admin/articles/${encodeURIComponent(article.id)}/review`, {});
      if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível enviar o artigo para revisão."));
      setPhase("review"); setFeedback({ kind: "success", message: "Revisão concluída. Confirme para publicar." });
    } catch (error) {
      console.error("Falha ao enviar artigo para revisão.", error);
      setPhase("ready"); setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível enviar o artigo para revisão." });
    }
  }

  async function publish(): Promise<void> {
    if (!article || !confirmed) return;
    setPhase("publishing"); setFeedback(null);
    try {
      const result = await sendJson(`/api/admin/articles/${encodeURIComponent(article.id)}/publish`, {});
      if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível publicar o artigo."));
      setPhase("published"); setFeedback({ kind: "success", message: "Artigo publicado e projeção pública atualizada." });
    } catch (error) {
      console.error("Falha ao publicar artigo.", error);
      setPhase("ready"); setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível publicar o artigo." });
    }
  }

  function editSavedDraft(): void {
    setEditingSaved(true); setConfirmed(false); setPhase("editing"); setFeedback(null);
  }

  if (loading) return <div className="adminEmpty" role="status"><strong>Carregando artigo…</strong></div>;
  const draftLocked = article !== null && !editingSaved;
  return (
    <div className="adminEditorLayout"><AdminCard><form key={initialDraft?.articleId ?? "new"} onSubmit={createDraft} aria-busy={phase === "saving" || phase === "reviewing" || phase === "publishing"}><fieldset disabled={draftLocked} style={{ border: 0, margin: 0, padding: 0 }}><VideoSourceSection draft={initialDraft} /><EditorialSection draft={initialDraft} /><ImageSection draft={initialDraft} /><OpinionAndFaqSection draft={initialDraft} /><SeoSection draft={initialDraft} /></fieldset>{article && !editingSaved ? <WorkflowActions phase={phase} article={article} confirmed={confirmed} feedback={feedback} onConfirm={setConfirmed} onEdit={editSavedDraft} onReview={submitForReview} onPublish={publish} /> : <DraftActions phase={phase} feedback={feedback} />}</form></AdminCard></div>
  );
}
