"use client";

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import type { AdminArticleSummary, ArticleDraftInput } from "@/db/admin-contracts";
import { AdminCard } from "../../admin-ui";

type Feedback = Readonly<{ kind: "success" | "error"; message: string }>;
type EditorPhase = "editing" | "saving" | "ready" | "publishing" | "published";

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

function youtubeVideoId(value: string): string | undefined {
  const match = value.match(/(?:v=|youtu\.be\/)([\w-]{6,20})/u);
  if (match?.[1]) return match[1];
  return /^[\w-]{6,20}$/u.test(value) ? value : undefined;
}

function articleDraft(form: HTMLFormElement): ArticleDraftInput {
  const data = new FormData(form);
  const videoId = youtubeVideoId(formText(data, "youtubeUrl"));
  const base: ArticleDraftInput = {
    title: formText(data, "title"), subtitle: formText(data, "subtitle"), slug: formText(data, "slug"),
    seoDescription: formText(data, "seoDescription"), categorySlug: formText(data, "categorySlug"),
    body: formText(data, "body").split(/\n\s*\n/u).map((item) => item.trim()).filter(Boolean),
    opinion: formText(data, "opinion"), imageUrl: formText(data, "imageUrl"), imageAlt: formText(data, "imageAlt"),
    readTimeMinutes: Number(formText(data, "readTimeMinutes")),
    faq: [{ question: formText(data, "faqQuestion"), answer: formText(data, "faqAnswer") }],
  };
  return videoId ? { ...base, youtubeVideoId: videoId } : base;
}

function VideoSourceSection(): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>1. Origem no YouTube</h2>
      <p>Informe o vídeo que originou a pauta. O CMS usa somente o ID já cadastrado no ambiente editorial.</p>
      <label className="adminField"><span>URL ou ID do vídeo</span><input name="youtubeUrl" required defaultValue="https://www.youtube.com/watch?v=jT0j_rCgbbc" /><small>Nenhuma chamada é feita ao YouTube neste formulário.</small></label>
    </section>
  );
}

function EditorialSection(): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>2. História editorial</h2><p>Transforme o vídeo em uma leitura clara, útil e independente.</p>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Título</span><input name="title" required maxLength={180} defaultValue="Trocar uma moto por uma Spin financiada: foi bom negócio?" /></label>
        <label className="adminField"><span>Subtítulo</span><textarea name="subtitle" required maxLength={360} defaultValue="O vídeo diverte, mas a conta pede atenção: entrada, prazo, juros e custo de uso mudam o resultado da troca." /></label>
        <div className="adminFieldGrid adminFieldGrid--two">
          <label className="adminField"><span>Categoria</span><select name="categorySlug" required defaultValue="negociacoes"><option value="negociacoes">Negociações</option><option value="compra-e-venda">Compra e Venda</option><option value="mercado-automotivo">Mercado Automotivo</option></select></label>
          <label className="adminField"><span>Tempo de leitura</span><input name="readTimeMinutes" required type="number" min="1" max="120" inputMode="numeric" defaultValue="6" /></label>
        </div>
        <label className="adminField"><span>Artigo completo</span><textarea name="body" required defaultValue={"Trocar uma moto por um carro familiar resolve uma necessidade real de espaço, conforto e proteção.\n\nPara saber se a troca faz sentido, some o valor entregue na moto, o total financiado, juros, seguro, combustível e manutenção provável."} /><small>Separe os parágrafos com uma linha em branco.</small></label>
      </div>
    </section>
  );
}

function ImageSection(): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>3. Imagem principal</h2><p>Use um caminho público do projeto ou uma URL HTTPS. Upload privado do R2 permanece desativado.</p>
      <label className="adminField"><span>Caminho ou URL da imagem</span><input name="imageUrl" required maxLength={500} defaultValue="/images/videos/spin-financiada-frame-source.png" /><small>Exemplo: /images/videos/capa.webp</small></label>
    </section>
  );
}

function OpinionAndFaqSection(): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>4. Opinião e FAQ</h2><p>A voz do Blog do Carro fica explícita e a principal dúvida recebe uma resposta direta.</p>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Minha opinião</span><textarea name="opinion" required maxLength={4000} defaultValue="Se a Spin resolve a vida da família, a troca pode fazer sentido. Mas o bom negócio só aparece depois de olhar o valor total." /></label>
        <label className="adminField"><span>Pergunta frequente</span><input name="faqQuestion" required maxLength={300} defaultValue="Uma parcela menor significa melhor negócio?" /></label>
        <label className="adminField"><span>Resposta</span><textarea name="faqAnswer" required maxLength={2000} defaultValue="Não necessariamente. Prazos longos reduzem a parcela e podem elevar bastante o total pago." /></label>
      </div>
    </section>
  );
}

function SeoSection(): ReactElement {
  return (
    <section className="adminFormSection">
      <h2>5. Busca e compartilhamento</h2><p>Estes campos alimentam a URL, a busca e os cards compartilhados.</p>
      <div className="adminFieldGrid">
        <label className="adminField"><span>Slug</span><input name="slug" required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue="spin-financiada-como-avaliar-a-troca" /></label>
        <label className="adminField"><span>Meta description</span><textarea name="seoDescription" required maxLength={180} defaultValue="Veja como avaliar entrada, juros e custo total antes de trocar uma moto por uma Chevrolet Spin financiada." /></label>
        <label className="adminField"><span>Texto alternativo da imagem</span><input name="imageAlt" required maxLength={240} defaultValue="Frame do vídeo sobre a troca de uma moto por uma Chevrolet Spin" /></label>
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

type PublishActionsProps = Readonly<{
  phase: EditorPhase;
  article: AdminArticleSummary;
  confirmed: boolean;
  feedback: Feedback | null;
  onConfirm: (confirmed: boolean) => void;
  onPublish: () => void;
}>;

function PublishActions(props: PublishActionsProps): ReactElement {
  const busy = props.phase === "publishing";
  const published = props.phase === "published";
  return (
    <div className="adminFormSection">
      <h2>6. Publicação</h2><p>O rascunho “{props.article.title}” foi salvo. Confirme a revisão antes de torná-lo público.</p>
      <label style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 10, color: "#c8c8c2", fontSize: ".67rem", fontWeight: 700 }}><input type="checkbox" style={{ width: 20, height: 20 }} checked={props.confirmed} disabled={busy || published} onChange={(event) => props.onConfirm(event.currentTarget.checked)} /> Confirmo título, conteúdo, imagem pública e FAQ.</label>
      <div className="adminFormActions"><button className="adminButton adminButton--primary" type="button" disabled={!props.confirmed || busy || published} onClick={props.onPublish}>{published ? "Artigo publicado" : busy ? "Publicando…" : "Publicar artigo"}</button><FeedbackMessage feedback={props.feedback} /></div>
    </div>
  );
}

function EditorialChecklist(): ReactElement {
  return (
    <AdminCard title="Critérios para publicação" eyebrow="Checklist editorial"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Rascunho persistido</strong><p>O conteúdo é validado e gravado antes de qualquer publicação.</p></div><div className="adminTimelineItem"><strong>Mídia pública</strong><p>Caminhos internos públicos e URLs HTTPS podem entrar na projeção.</p></div><div className="adminTimelineItem"><strong>Publicação consciente</strong><p>A segunda etapa exige confirmação explícita e permissão editorial.</p></div></div></AdminCard>
  );
}

export function ArticleEditor(): ReactElement {
  const [phase, setPhase] = useState<EditorPhase>("editing");
  const [article, setArticle] = useState<AdminArticleSummary | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function createDraft(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setPhase("saving"); setFeedback(null);
    try {
      const result = await sendJson("/api/admin/articles", articleDraft(event.currentTarget));
      if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível salvar o rascunho."));
      const saved = articleFromPayload(result.payload);
      if (!saved) throw new Error("O CMS retornou um rascunho inválido.");
      setArticle(saved); setPhase("ready"); setFeedback({ kind: "success", message: "Rascunho salvo. Revise e confirme a publicação." });
    } catch (error) {
      console.error("Falha ao criar rascunho editorial.", error);
      setPhase("editing"); setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível salvar o rascunho." });
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

  const draftCreated = article !== null;
  return (
    <div className="adminGrid adminGrid--split"><AdminCard><form onSubmit={createDraft}><fieldset disabled={draftCreated} style={{ border: 0, margin: 0, padding: 0 }}><VideoSourceSection /><EditorialSection /><ImageSection /><OpinionAndFaqSection /><SeoSection /></fieldset>{article ? <PublishActions phase={phase} article={article} confirmed={confirmed} feedback={feedback} onConfirm={setConfirmed} onPublish={publish} /> : <DraftActions phase={phase} feedback={feedback} />}</form></AdminCard><EditorialChecklist /></div>
  );
}
