import type { AudiencePurpose } from "@/domain/audience";
import type { D1Database, D1Row } from "@/db/d1";

export type AudienceSubscriptionInput = Readonly<{
  emailHmac: string;
  emailCiphertext: string;
  emailIv: string;
  purpose: AudiencePurpose;
  productId: string;
  sourcePath: string;
  consentVersion: string;
  consentTextHash: string;
  tokenHash: string;
  now: number;
}>;

export type AudienceSummary = Readonly<{
  purpose: AudiencePurpose;
  pending: number;
  active: number;
  revoked: number;
  suppressed: number;
}>;

export type AudienceSubscriptionRow = Readonly<{
  id: string;
  emailCiphertext: string;
  emailIv: string;
  productId: string;
  status: "pending" | "active" | "revoked" | "suppressed";
  sourcePath: string;
  requestedAt: number;
}>;

function numberValue(row: D1Row, key: string): number {
  const value = row[key];
  return typeof value === "number" ? value : 0;
}

export class AudienceRepository {
  constructor(private readonly database: D1Database) {}

  async requestSubscription(input: AudienceSubscriptionInput): Promise<"pending" | "active" | "revoked" | "suppressed"> {
    const contactId = crypto.randomUUID();
    const subscriptionId = crypto.randomUUID();
    const tokenId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    await this.database.batch(this.requestStatements(input, { contactId, subscriptionId, tokenId, eventId }));
    const row = await this.database.prepare(
      "SELECT status FROM audience_subscriptions WHERE contact_id = (SELECT id FROM audience_contacts WHERE email_lookup_hmac = ?) AND purpose = ? AND product_id = ?",
    ).bind(input.emailHmac, input.purpose, input.productId).first();
    if (!row || typeof row.status !== "string") throw new Error("Assinatura não persistida.");
    if (row.status === "pending" || row.status === "active" || row.status === "revoked" || row.status === "suppressed") return row.status;
    throw new Error("Estado de assinatura inválido.");
  }

  async consumeLimit(
    keyHash: string,
    kind: "email" | "network",
    now: number,
    windowMs: number,
    maximum: number,
  ): Promise<boolean> {
    const resetBefore = now - windowMs;
    await this.database.prepare("INSERT INTO audience_request_limits (key_hash,limit_kind,window_started_at,request_count,updated_at) VALUES (?,?,?,1,?) ON CONFLICT(key_hash,limit_kind) DO UPDATE SET request_count=CASE WHEN window_started_at<=? THEN 1 ELSE request_count+1 END, window_started_at=CASE WHEN window_started_at<=? THEN ? ELSE window_started_at END, updated_at=?").bind(keyHash, kind, now, now, resetBefore, resetBefore, now, now).run();
    const row = await this.database.prepare("SELECT request_count FROM audience_request_limits WHERE key_hash=? AND limit_kind=?").bind(keyHash, kind).first();
    return Boolean(row && typeof row.request_count === "number" && row.request_count <= maximum);
  }

  private requestStatements(input: AudienceSubscriptionInput, ids: Readonly<Record<string, string>>) {
    const expiresAt = input.now + 24 * 60 * 60 * 1_000;
    return [
      this.database.prepare("INSERT OR IGNORE INTO audience_contacts (id,email_lookup_hmac,email_ciphertext,email_iv,created_at,updated_at) VALUES (?,?,?,?,?,?)").bind(ids.contactId, input.emailHmac, input.emailCiphertext, input.emailIv, input.now, input.now),
      this.database.prepare("INSERT OR IGNORE INTO audience_subscriptions (id,contact_id,purpose,product_id,status,source_path,consent_version,consent_text_hash,requested_at,updated_at) SELECT ?,id,?,?,'pending',?,?,?,?,? FROM audience_contacts WHERE email_lookup_hmac=?").bind(ids.subscriptionId, input.purpose, input.productId, input.sourcePath, input.consentVersion, input.consentTextHash, input.now, input.now, input.emailHmac),
      this.database.prepare("UPDATE audience_subscriptions SET source_path=?, consent_version=?, consent_text_hash=?, requested_at=?, updated_at=? WHERE contact_id=(SELECT id FROM audience_contacts WHERE email_lookup_hmac=?) AND purpose=? AND product_id=? AND status='pending'").bind(input.sourcePath, input.consentVersion, input.consentTextHash, input.now, input.now, input.emailHmac, input.purpose, input.productId),
      this.database.prepare("DELETE FROM audience_tokens WHERE subscription_id=(SELECT s.id FROM audience_subscriptions s JOIN audience_contacts c ON c.id=s.contact_id WHERE c.email_lookup_hmac=? AND s.purpose=? AND s.product_id=?) AND token_kind='confirmation' AND consumed_at IS NULL").bind(input.emailHmac, input.purpose, input.productId),
      this.database.prepare("INSERT INTO audience_tokens (id,subscription_id,token_kind,token_hash,expires_at,created_at) SELECT ?,s.id,'confirmation',?,?,? FROM audience_subscriptions s JOIN audience_contacts c ON c.id=s.contact_id WHERE c.email_lookup_hmac=? AND s.purpose=? AND s.product_id=? AND s.status='pending'").bind(ids.tokenId, input.tokenHash, expiresAt, input.now, input.emailHmac, input.purpose, input.productId),
      this.database.prepare("INSERT INTO audience_consent_events (id,subscription_id,event_type,consent_version,source_path,occurred_at) SELECT ?,s.id,'requested',?,?,? FROM audience_subscriptions s JOIN audience_contacts c ON c.id=s.contact_id WHERE c.email_lookup_hmac=? AND s.purpose=? AND s.product_id=? AND s.status='pending'").bind(ids.eventId, input.consentVersion, input.sourcePath, input.now, input.emailHmac, input.purpose, input.productId),
    ];
  }

  async confirm(tokenHash: string, now: number): Promise<boolean> {
    const row = await this.database.prepare("SELECT subscription_id FROM audience_tokens WHERE token_hash=? AND token_kind='confirmation' AND consumed_at IS NULL AND expires_at>?").bind(tokenHash, now).first();
    if (!row || typeof row.subscription_id !== "string") return false;
    await this.database.batch([
      this.database.prepare("UPDATE audience_tokens SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?").bind(now, tokenHash, now),
      this.database.prepare("UPDATE audience_subscriptions SET status='active', confirmed_at=?, updated_at=? WHERE id=? AND status='pending'").bind(now, now, row.subscription_id),
      this.database.prepare("INSERT INTO audience_consent_events (id,subscription_id,event_type,consent_version,source_path,occurred_at) SELECT ?,id,'confirmed',consent_version,source_path,? FROM audience_subscriptions WHERE id=? AND status='active'").bind(crypto.randomUUID(), now, row.subscription_id),
    ]);
    return true;
  }

  async summaries(): Promise<readonly AudienceSummary[]> {
    const result = await this.database.prepare("SELECT purpose, SUM(status='pending') pending, SUM(status='active') active, SUM(status='revoked') revoked, SUM(status='suppressed') suppressed FROM audience_subscriptions GROUP BY purpose").all();
    return result.results.flatMap((row) => row.purpose === "store_launch" || row.purpose === "editorial_newsletter" ? [{ purpose: row.purpose, pending: numberValue(row, "pending"), active: numberValue(row, "active"), revoked: numberValue(row, "revoked"), suppressed: numberValue(row, "suppressed") }] : []);
  }

  async listRecent(purpose: AudiencePurpose, limit = 50): Promise<readonly AudienceSubscriptionRow[]> {
    const result = await this.database.prepare("SELECT s.id,c.email_ciphertext,c.email_iv,s.product_id,s.status,s.source_path,s.requested_at FROM audience_subscriptions s JOIN audience_contacts c ON c.id=s.contact_id WHERE s.purpose=? ORDER BY s.requested_at DESC LIMIT ?").bind(purpose, Math.min(Math.max(limit, 1), 100)).all();
    return result.results.flatMap((row) => {
      if (typeof row.id !== "string" || typeof row.email_ciphertext !== "string" || typeof row.email_iv !== "string") return [];
      if (row.status !== "pending" && row.status !== "active" && row.status !== "revoked" && row.status !== "suppressed") return [];
      return [{ id: row.id, emailCiphertext: row.email_ciphertext, emailIv: row.email_iv, productId: typeof row.product_id === "string" ? row.product_id : "", status: row.status, sourcePath: typeof row.source_path === "string" ? row.source_path : "", requestedAt: typeof row.requested_at === "number" ? row.requested_at : 0 }];
    });
  }
}
