import {
  audienceConsentVersion,
  consentText,
  isAudiencePurpose,
  normalizeAudienceEmail,
  normalizeSourcePath,
} from "@/domain/audience";
import type { AudiencePurpose } from "@/domain/audience";
import { AudienceRepository } from "./audience-repository";
import { emailLookupHmac, encryptAudienceEmail, sha256 } from "./audience-crypto";
import { ResendEmailProvider } from "./email-provider";
import { buildAudienceConfirmationEmail } from "./email-templates";
import {
  getAudienceSecrets,
  getResendConfig,
  getRuntimeDatabase,
  getTurnstileConfig,
  isAudienceCaptureEnabled,
  isResendSendEnabled,
} from "./runtime-bindings";

type SubscriptionRequest = Readonly<{
  email: unknown;
  purpose: unknown;
  productId?: unknown;
  sourcePath: unknown;
  consent: unknown;
  turnstileToken: unknown;
}>;

export type SubscriptionResult = "accepted" | "invalid" | "unavailable" | "challenge_failed" | "rate_limited";
export type SubscriptionContext = Readonly<{ origin: string; remoteAddress: string | null }>;

function productIdFor(purpose: AudiencePurpose, value: unknown): string | null {
  if (purpose === "editorial_newsletter") return "";
  if (typeof value !== "string" || !/^[a-z0-9-]{1,80}$/u.test(value)) return null;
  return value;
}

async function verifyTurnstile(token: unknown, secret: string): Promise<boolean> {
  if (typeof token !== "string" || token.length < 10 || token.length > 2_048) return false;
  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!response.ok) return false;
  const payload: unknown = await response.json();
  return typeof payload === "object" && payload !== null && "success" in payload && payload.success === true;
}

export async function requestAudienceSubscription(
  value: unknown,
  context: SubscriptionContext,
): Promise<SubscriptionResult> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "invalid";
  const input: SubscriptionRequest = {
    email: "email" in value ? value.email : null,
    purpose: "purpose" in value ? value.purpose : null,
    productId: "productId" in value ? value.productId : null,
    sourcePath: "sourcePath" in value ? value.sourcePath : null,
    consent: "consent" in value ? value.consent : null,
    turnstileToken: "turnstileToken" in value ? value.turnstileToken : null,
  };
  if (!isAudienceCaptureEnabled() || !isResendSendEnabled()) return "unavailable";
  const database = getRuntimeDatabase();
  const secrets = getAudienceSecrets();
  const resend = getResendConfig();
  const turnstile = getTurnstileConfig();
  if (!database || !secrets || !resend || !turnstile) return "unavailable";
  if (!isAudiencePurpose(input.purpose) || input.consent !== true) return "invalid";
  const email = normalizeAudienceEmail(input.email);
  const sourcePath = normalizeSourcePath(input.sourcePath);
  const productId = productIdFor(input.purpose, input.productId);
  if (!email || !sourcePath || productId === null) return "invalid";
  const repository = new AudienceRepository(database);
  const emailKey = await emailLookupHmac(`email:${email}`, secrets.lookupKey);
  if (context.remoteAddress) {
    const networkKey = await emailLookupHmac(`network:${context.remoteAddress}`, secrets.lookupKey);
    if (!await repository.consumeLimit(networkKey, "network", Date.now(), 10 * 60_000, 10)) return "rate_limited";
  }
  if (!await verifyTurnstile(input.turnstileToken, turnstile.secret)) return "challenge_failed";
  if (!await repository.consumeLimit(emailKey, "email", Date.now(), 15 * 60_000, 5)) return "rate_limited";
  await persistAndSend({ email, purpose: input.purpose, productId, sourcePath, origin: context.origin }, database, secrets, resend);
  return "accepted";
}

async function persistAndSend(
  input: Readonly<{ email: string; purpose: AudiencePurpose; productId: string; sourcePath: string; origin: string }>,
  database: NonNullable<ReturnType<typeof getRuntimeDatabase>>,
  secrets: NonNullable<ReturnType<typeof getAudienceSecrets>>,
  resend: NonNullable<ReturnType<typeof getResendConfig>>,
): Promise<void> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const encrypted = await encryptAudienceEmail(input.email, secrets.encryptionKey);
  const repository = new AudienceRepository(database);
  const status = await repository.requestSubscription({
    emailHmac: await emailLookupHmac(input.email, secrets.lookupKey),
    emailCiphertext: encrypted.ciphertext,
    emailIv: encrypted.iv,
    purpose: input.purpose,
    productId: input.productId,
    sourcePath: input.sourcePath,
    consentVersion: audienceConsentVersion,
    consentTextHash: await sha256(consentText(input.purpose)),
    tokenHash: await sha256(token),
    now: Date.now(),
  });
  if (status !== "pending") return;
  const link = `${input.origin}/confirmar-inscricao#token=${encodeURIComponent(token)}`;
  const message = buildAudienceConfirmationEmail(link, input.purpose);
  await new ResendEmailProvider(resend.apiKey, resend.from).sendTransactional({
    to: input.email, ...message, idempotencyKey: crypto.randomUUID(),
  });
}

export async function confirmAudienceSubscription(token: unknown): Promise<boolean> {
  if (!isAudienceCaptureEnabled()) return false;
  if (typeof token !== "string" || token.length < 40 || token.length > 160) return false;
  const database = getRuntimeDatabase();
  if (!database) return false;
  return new AudienceRepository(database).confirm(await sha256(token), Date.now());
}
