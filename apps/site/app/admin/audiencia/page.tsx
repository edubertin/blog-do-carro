import type { ReactElement } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import type { AudiencePurpose } from "@/domain/audience";
import { decryptAudienceEmail } from "@/server/audience-crypto";
import { AudienceRepository } from "@/server/audience-repository";
import { getAudienceSecrets, getRuntimeDatabase } from "@/server/runtime-bindings";
import { requireAdminPage } from "../admin-auth";
import { AdminCard, AdminPageHeader, EmptyState, MetricCard } from "../admin-ui";

type Summary = Awaited<ReturnType<AudienceRepository["summaries"]>>[number];
type Subscription = Awaited<ReturnType<AudienceRepository["listRecent"]>>[number];
type Tab = "loja" | "newsletter";

function emptySummary(purpose: AudiencePurpose): Summary {
  return { purpose, pending: 0, active: 0, revoked: 0, suppressed: 0 };
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}${"•".repeat(Math.max(3, Math.min(local.length - 2, 8)))}@${domain}`;
}

async function loadAudience(purpose: AudiencePurpose): Promise<Readonly<{ summaries: readonly Summary[]; rows: readonly Subscription[]; encryptionKey: string | null }>> {
  const identity = await requireAdminPage("audience.read");
  const database = getRuntimeDatabase();
  const secrets = getAudienceSecrets();
  if (!identity || !database) return { summaries: [], rows: [], encryptionKey: null };
  const repository = new AudienceRepository(database);
  try {
    return { summaries: await repository.summaries(), rows: await repository.listRecent(purpose), encryptionKey: secrets?.encryptionKey ?? null };
  } catch (error) {
    console.error(JSON.stringify({ event: "admin.audience.load.failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return { summaries: [], rows: [], encryptionKey: null };
  }
}

async function AudienceList({ rows, encryptionKey }: Readonly<{ rows: readonly Subscription[]; encryptionKey: string | null }>): Promise<ReactElement> {
  if (rows.length === 0) return <EmptyState title="Nenhuma inscrição ainda" text="A captação permanece fechada até a configuração segura do Resend, DNS e proteção antiabuso." />;
  const items = await Promise.all(rows.map(async (row) => ({ ...row, email: encryptionKey ? maskEmail(await decryptAudienceEmail(row.emailCiphertext, row.emailIv, encryptionKey)) : "E-mail protegido" })));
  return <div className="audienceAdminList">{items.map((item) => <article key={item.id}><div><strong>{item.email}</strong><span>{item.productId || "Newsletter editorial"}</span></div><div><span className={`adminStatus adminStatus--${item.status === "active" ? "connected" : "pending"}`}>{item.status === "active" ? "Confirmado" : item.status === "pending" ? "Pendente" : "Inativo"}</span><time dateTime={new Date(item.requestedAt).toISOString()}>{new Intl.DateTimeFormat("pt-BR").format(item.requestedAt)}</time></div></article>)}</div>;
}

export default async function AudiencePage({ searchParams }: Readonly<{ searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>> }>): Promise<ReactElement> {
  const params = await searchParams;
  const tab: Tab = params.tab === "newsletter" ? "newsletter" : "loja";
  const purpose: AudiencePurpose = tab === "loja" ? "store_launch" : "editorial_newsletter";
  const data = await loadAudience(purpose);
  const byPurpose = (value: AudiencePurpose): Summary => data.summaries.find((row) => row.purpose === value) ?? emptySummary(value);
  const store = byPurpose("store_launch");
  const newsletter = byPurpose("editorial_newsletter");
  return <><AdminPageHeader eyebrow="Audiência" title="Consentimento, não lista solta" description="Interesse na loja e newsletter são finalidades independentes. Os e-mails aparecem mascarados e nunca entram no Analytics." /><div className="adminGrid adminGrid--metrics"><MetricCard label="Loja confirmada" value={String(store.active)} detail="avisos de lançamento" tone="brand" /><MetricCard label="Newsletter confirmada" value={String(newsletter.active)} detail="artigos e análises" /><MetricCard label="Aguardando confirmação" value={String(store.pending + newsletter.pending)} detail="double opt-in" tone="warning" /><MetricCard label="Suprimidos" value={String(store.suppressed + newsletter.suppressed)} detail="bounce ou reclamação" /></div><AdminCard title={tab === "loja" ? "Interesse na loja" : "Newsletter editorial"} eyebrow="Inscrições recentes"><nav className="audienceAdminTabs" aria-label="Listas de audiência"><Link href="/admin/audiencia?tab=loja" aria-current={tab === "loja" ? "page" : undefined}>Loja</Link><Link href="/admin/audiencia?tab=newsletter" aria-current={tab === "newsletter" ? "page" : undefined}>Newsletter</Link></nav><AudienceList rows={data.rows} encryptionKey={data.encryptionKey} /></AdminCard></>;
}
