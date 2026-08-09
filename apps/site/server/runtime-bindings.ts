import { env } from "cloudflare:workers";
import type { D1Database } from "../db/d1";

export type RuntimeMediaBucket = NonNullable<typeof env.MEDIA>;

export function getRuntimeDatabase(): D1Database | null {
  return env.DB ?? null;
}

export function getRuntimeMediaBucket(): RuntimeMediaBucket | null {
  return env.MEDIA ?? null;
}

export function isCmsWriteEnabled(): boolean {
  return env.CMS_WRITE_ENABLED === "1";
}

export function isPublicD1ReadEnabled(): boolean {
  return env.CMS_PUBLIC_READ_ENABLED === "1";
}

export function isMediaUploadEnabled(): boolean {
  return env.MEDIA_UPLOAD_ENABLED === "1";
}

export function getAdminSubjectHmacKey(): string | null {
  return env.ADMIN_SUBJECT_HMAC_KEY?.trim() || null;
}

export function getAudienceSecrets(): Readonly<{
  encryptionKey: string;
  lookupKey: string;
}> | null {
  const encryptionKey = env.AUDIENCE_ENCRYPTION_KEY?.trim();
  const lookupKey = env.AUDIENCE_LOOKUP_HMAC_KEY?.trim();
  return encryptionKey && lookupKey ? { encryptionKey, lookupKey } : null;
}

export function isAudienceCaptureEnabled(): boolean {
  return env.AUDIENCE_CAPTURE_ENABLED === "1";
}

export function isResendSendEnabled(): boolean {
  return env.RESEND_SEND_ENABLED === "1";
}

export function getResendConfig(): Readonly<{ apiKey: string; from: string }> | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

export function getTurnstileConfig(): Readonly<{ secret: string; siteKey: string }> | null {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = env.TURNSTILE_SITE_KEY?.trim();
  return secret && siteKey ? { secret, siteKey } : null;
}

export function getPublicAudienceConfig(): Readonly<{ enabled: boolean; siteKey: string | null }> {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim() || null;
  const enabled = isAudienceCaptureEnabled() && isResendSendEnabled()
    && Boolean(getAudienceSecrets() && getResendConfig() && getTurnstileConfig());
  return { enabled, siteKey };
}
