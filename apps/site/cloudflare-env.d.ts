type MediaObject = Readonly<{
  body: ReadableStream<Uint8Array>;
  httpMetadata?: Readonly<{ contentType?: string }>;
}>;

type MediaPutOptions = Readonly<{
  httpMetadata: Readonly<{ contentType: string }>;
  customMetadata: Readonly<Record<string, string>>;
}>;

interface MediaBucket {
  put(key: string, body: ArrayBuffer, options: MediaPutOptions): Promise<void>;
  get(key: string): Promise<MediaObject | null>;
  delete(key: string): Promise<void>;
}

declare module "cloudflare:workers" {
  export const env: Readonly<{
    DB?: import("./db/d1").D1Database;
    MEDIA?: MediaBucket;
    CMS_WRITE_ENABLED?: string;
    CMS_PUBLIC_READ_ENABLED?: string;
    MEDIA_UPLOAD_ENABLED?: string;
    ADMIN_SUBJECT_HMAC_KEY?: string;
    AUDIENCE_CAPTURE_ENABLED?: string;
    AUDIENCE_ENCRYPTION_KEY?: string;
    AUDIENCE_LOOKUP_HMAC_KEY?: string;
    RESEND_SEND_ENABLED?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
  }>;
}
