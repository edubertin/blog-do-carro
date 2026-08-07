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
  }>;
}
