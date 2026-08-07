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
