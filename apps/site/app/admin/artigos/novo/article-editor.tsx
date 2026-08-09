"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import type { AdminArticleEditorRecord, AdminArticleSummary, ArticleDraftInput } from "@/db/admin-contracts";
import { legacyBodyToDocument, parseArticleContent } from "@/domain/article-content";
import { AdminCard } from "../../admin-ui";
import Image from "next/image";
import { RevisionHistory } from "./revision-history";
import { managedMediaAssetId } from "@/domain/media-path";
import { ContinuousArticleEditor } from "./structured-editor/continuous-article-editor";

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
    && typeof value.version === "number" && typeof value.updatedAt === "number"
    && (value.videoAvailability === "pending" || value.videoAvailability === "ready");
}

function articleFromPayload(value: unknown): AdminArticleSummary | null {
  if (!isRecord(value) || !isArticle(value.article)) return null;
  return value.article;
}

function isDraft(value: unknown): value is ArticleDraftInput {
  if (!isRecord(value)) return false;
  return typeof value.title === "string" && typeof value.subtitle === "string" && typeof value.slug === "string"
    && typeof value.seoDescription === "string" && typeof value.categorySlug === "string" && (isRecord(value.body) || Array.isArray(value.body))
    && typeof value.opinion === "string" && typeof value.imageUrl === "string" && typeof value.imageAlt === "string"
    && typeof value.youtubeVideoId === "string" && typeof value.readTimeMinutes === "number" && Array.isArray(value.faq);
}

function editorRecord(value: unknown): AdminArticleEditorRecord | null {
  if (!isRecord(value) || !isArticle(value.article) || !isDraft(value.draft)) return null;
  const body = Array.isArray(value.draft.body)
    ? legacyBodyToDocument(value.draft.body.filter((item): item is string => typeof item === "string"))
    : parseArticleContent(value.draft.body);
  return { article: value.article, draft: { ...value.draft, body } };
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

function articleDraft(form: HTMLFormElement, articleId?: string): ArticleDraftInput {
  const data = new FormData(form);
  const input: ArticleDraftInput = {
    articleId,
    title: formText(data, "title"), subtitle: formText(data, "subtitle"), slug: formText(data, "slug"),
    seoDescription: formText(data, "seoDescription"), categorySlug: formText(data, "categorySlug"),
    body: parseArticleContent(JSON.parse(formText(data, "bodyJson"))),
    opinion: formText(data, "opinion"), imageUrl: formText(data, "imageUrl"), imageAlt: formText(data, "imageAlt"),
    youtubeVideoId: youtubeVideoId(formText(data, "youtubeUrl")),
    readTimeMinutes: Number(formText(data, "readTimeMinutes")),
    faq: [{ question: formText(data, "faqQuestion"), answer: formText(data, "faqAnswer") }],
  };
  return input;
}

type DraftSectionProps = Readonly<{
  draft: ArticleDraftInput | null;
  onUploadingChange?: (uploading: boolean) => void;
}>;

function VideoSourceSection({ draft }: DraftSectionProps): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>1. Origem no YouTube</h2>
      <label className="adminField"><span>URL ou ID do vídeo</span><input name="youtubeUrl" required minLength={6} maxLength={300} inputMode="url" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://youtube.com/watch?v=..." defaultValue={draft?.youtubeVideoId ?? ""} aria-describedby="youtube-help" /><small id="youtube-help">Cole o link do vídeo que será a fonte do artigo.</small></label>
    </section>
  );
}

function EditorialSection({ draft, onUploadingChange }: DraftSectionProps): ReactElement {
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
        <StructuredBodyEditor initialBody={draft?.body ?? legacyBodyToDocument([""])} onUploadingChange={onUploadingChange} />
      </div>
    </section>
  );
}

type UploadedAsset = Readonly<{ id: string; url: string; altText: string; width: number; height: number }>;

async function uploadImage(file: File, altText: string): Promise<UploadedAsset> {
  const form = new FormData();
  form.set("file", file); form.set("altText", altText);
  const response = await fetch("/api/admin/media", { method: "POST", body: form, credentials: "same-origin" });
  const payload = await responsePayload(response);
  if (!response.ok || !isRecord(payload) || !isRecord(payload.asset) || typeof payload.asset.id !== "string"
    || typeof payload.asset.width !== "number" || typeof payload.asset.height !== "number") {
    throw new Error(apiError(payload, "Não foi possível enviar a imagem."));
  }
  return { id: payload.asset.id, url: `/api/admin/media/${payload.asset.id}`, altText, width: payload.asset.width, height: payload.asset.height };
}

function StructuredBodyEditor({ initialBody, onUploadingChange }: Readonly<{
  initialBody: ArticleDraftInput["body"];
  onUploadingChange?: (uploading: boolean) => void;
}>): ReactElement {
  const [document, setDocument] = useState(initialBody);
  async function upload(file: File, alt: string) {
    const asset = await uploadImage(file, alt);
    return { assetId: asset.id, width: asset.width, height: asset.height };
  }
  return <div className="adminField"><span>Artigo completo</span>
    <input type="hidden" name="bodyJson" value={JSON.stringify(document)} />
    <ContinuousArticleEditor initialDocument={document} onChange={setDocument} onUpload={upload} onUploadingChange={onUploadingChange} />
  </div>;
}

function ImageSection({ draft, onUploadingChange }: DraftSectionProps): ReactElement {
  const legacyCover = draft?.imageUrl && !managedMediaAssetId(draft.imageUrl) ? draft.imageUrl : null;
  const [imageUrl, setImageUrl] = useState(legacyCover ? "" : draft?.imageUrl ?? "");
  const [imageAlt, setImageAlt] = useState(draft?.imageAlt ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasImage = imageUrl.trim().length > 0;
  const assetId = managedMediaAssetId(imageUrl);

  async function uploadCover(file: File): Promise<void> {
    if (imageAlt.trim().length < 5) { setError("Descreva a imagem antes de enviar a capa."); return; }
    setUploading(true); onUploadingChange?.(true); setError(null);
    try {
      const asset = await uploadImage(file, imageAlt.trim());
      setImageUrl(`/media/${asset.id}`);
    } catch (uploadError) {
      console.error("Falha no upload da imagem principal.", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Falha no upload da capa.");
    } finally { setUploading(false); onUploadingChange?.(false); }
  }

  return (
    <section className="adminFormSection">
      <h2>3. Imagem principal</h2>
      <div className="adminFieldGrid">
        <input name="imageUrl" type="hidden" value={imageUrl} />
        <label className="adminField"><span>Descrição acessível da imagem</span><input name="imageAlt" required minLength={5} maxLength={240} placeholder="Descreva o que aparece na imagem" value={imageAlt} onChange={(event) => setImageAlt(event.currentTarget.value)} /></label>
      </div>
      <p className="adminFieldHint">Use preferencialmente uma capa horizontal de 1600 × 900 px. A prévia abaixo mostra o recorte 16:9 usado no destaque da página inicial.</p>
      {legacyCover ? <p className="adminMediaWarning" role="status">A capa antiga usa um endereço externo. Envie o arquivo novamente para salvar uma nova revisão.</p> : null}
      {assetId ? <Image className="adminCoverPreview" src={`/api/admin/media/${assetId}`} alt={imageAlt} width={960} height={540} unoptimized /> : <p className="adminMediaPlaceholder">Nenhuma capa enviada. Descreva a imagem e escolha um arquivo JPEG, PNG ou WebP.</p>}
      <div className="adminMediaActions"><label className="adminFileControl"><input className="adminVisuallyHiddenFile" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} aria-label={hasImage ? "Substituir imagem da capa" : "Escolher imagem da capa"} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadCover(file); }} /><span className={`adminButton adminButton--primary${uploading ? " is-disabled" : ""}`} aria-hidden="true">{uploading ? "Enviando capa…" : hasImage ? "Substituir imagem da capa" : "Escolher imagem da capa"}</span></label><button className="adminButton adminButton--secondary" type="button" disabled={!hasImage || uploading} onClick={() => setImageUrl("")}>Remover arquivo</button></div>
      {error ? <small role="alert">{error}</small> : null}
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

type DraftActionsProps = Readonly<{ phase: EditorPhase; feedback: Feedback | null; mediaUploading: boolean }>;

function DraftActions({ phase, feedback, mediaUploading }: DraftActionsProps): ReactElement {
  const saving = phase === "saving";
  const busy = saving || mediaUploading;
  return <div className="adminFormActions"><button className="adminButton adminButton--primary" type="submit" disabled={busy}>{saving ? "Salvando…" : mediaUploading ? "Aguarde o envio da imagem…" : "Salvar rascunho"}</button><FeedbackMessage feedback={feedback} /></div>;
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
        <button className="adminButton adminButton--secondary" type="button" disabled={busy || inReview} onClick={props.onEdit}>{published ? "Criar nova revisão" : "Editar conteúdo"}</button>
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
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [mediaUploads, setMediaUploads] = useState<Readonly<Record<"body" | "cover", boolean>>>({ body: false, cover: false });
  const mediaUploading = mediaUploads.body || mediaUploads.cover;
  function trackUpload(source: "body" | "cover", uploading: boolean): void {
    setMediaUploads((current) => ({ ...current, [source]: uploading }));
  }

  useEffect(() => {
    const requestedArticleId = new URLSearchParams(window.location.search).get("article");
    let active = true;
    if (!requestedArticleId) {
      queueMicrotask(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }
    loadEditorRecord(requestedArticleId).then((record) => {
      if (!active) return;
      const published = record.article.state === "published";
      setArticle(record.article); setInitialDraft(record.draft); setEditingSaved(!published); setPhase(published ? "published" : "editing");
    }).catch((error: unknown) => {
      console.error("Falha ao carregar artigo para revisão.", error);
      if (active) setLoadFailure(error instanceof Error ? error.message : "Não foi possível carregar o artigo.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadAttempt]);

  async function createDraft(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (mediaUploading) { setFeedback({ kind: "error", message: "Aguarde o envio da imagem terminar antes de salvar." }); return; }
    setPhase("saving"); setFeedback(null);
    try {
      const result = await sendJson("/api/admin/articles", articleDraft(event.currentTarget, article?.id));
      if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível salvar o rascunho."));
      const saved = articleFromPayload(result.payload);
      if (!saved) throw new Error("O CMS retornou um rascunho inválido.");
      const message = saved.videoAvailability === "pending"
        ? "Vídeo adicionado como origem pendente. Os dados serão sincronizados quando ele estiver público."
        : "Rascunho salvo. Revise e envie para aprovação.";
      window.history.replaceState(null, "", `/admin/artigos/novo?article=${encodeURIComponent(saved.id)}`);
      setArticle(saved); setEditingSaved(false); setPhase("ready"); setFeedback({ kind: "success", message });
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
      try {
        const record = await loadEditorRecord(article.id);
        setArticle(record.article); setInitialDraft(record.draft);
      } catch (refreshError) {
        console.error("O artigo foi publicado, mas o editor precisa recarregar a versão atual.", refreshError);
        window.location.reload();
      }
    } catch (error) {
      console.error("Falha ao publicar artigo.", error);
      setPhase("ready"); setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível publicar o artigo." });
    }
  }

  function editSavedDraft(): void {
    setEditingSaved(true); setConfirmed(false); setPhase("editing"); setFeedback(null);
  }

  async function reloadRestoredDraft(): Promise<void> {
    if (!article) return;
    const record = await loadEditorRecord(article.id);
    setArticle(record.article);
    setInitialDraft(record.draft);
    setEditingSaved(true);
    setConfirmed(false);
    setPhase("editing");
    setFeedback(null);
  }

  if (loading) return <div className="adminEmpty" role="status"><strong>Carregando artigo…</strong></div>;
  if (loadFailure) return <div className="adminEmpty" role="alert"><strong>Não foi possível abrir este artigo.</strong><p>{loadFailure}</p><div className="adminFormActions"><button type="button" className="adminButton adminButton--primary" onClick={() => { setLoadFailure(null); setLoading(true); setLoadAttempt((current) => current + 1); }}>Tentar novamente</button><a className="adminButton adminButton--secondary" href="/admin/artigos">Voltar aos artigos</a></div></div>;
  const draftLocked = article !== null && !editingSaved;
  return (
    <div className="adminEditorLayout"><AdminCard><form key={article?.revisionId ?? initialDraft?.articleId ?? "new"} onSubmit={createDraft} aria-busy={phase === "saving" || phase === "reviewing" || phase === "publishing" || mediaUploading}><fieldset disabled={draftLocked} style={{ border: 0, margin: 0, padding: 0 }}><VideoSourceSection draft={initialDraft} /><EditorialSection draft={initialDraft} onUploadingChange={(uploading) => trackUpload("body", uploading)} /><ImageSection draft={initialDraft} onUploadingChange={(uploading) => trackUpload("cover", uploading)} /><OpinionAndFaqSection draft={initialDraft} /><SeoSection draft={initialDraft} /></fieldset>{article && !editingSaved ? <WorkflowActions phase={phase} article={article} confirmed={confirmed} feedback={feedback} onConfirm={setConfirmed} onEdit={editSavedDraft} onReview={submitForReview} onPublish={publish} /> : <DraftActions phase={phase} feedback={feedback} mediaUploading={mediaUploading} />}</form></AdminCard>{article ? <RevisionHistory article={article} onRestored={reloadRestoredDraft} /> : null}</div>
  );
}
