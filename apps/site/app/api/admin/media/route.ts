import type { MediaAssetRecord } from "@/db/admin-contracts";
import { saveMediaAsset } from "@/db/repositories/d1-admin-repository";
import { adminError, adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { getRuntimeMediaBucket, isMediaUploadEnabled } from "@/server/runtime-bindings";
import { sanitizeImageUpload } from "@/domain/image-upload";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

function mediaInput(form: FormData): Readonly<{ file: File; altText: string }> {
  const file = form.get("file");
  const altText = form.get("altText");
  if (!(file instanceof File) || typeof altText !== "string") throw new Error("Arquivo e texto alternativo são obrigatórios.");
  const normalizedAlt = altText.trim();
  if (normalizedAlt.length < 5 || normalizedAlt.length > 240) throw new Error("Texto alternativo inválido.");
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error("A imagem deve ter até 5 MB.");
  return { file, altText: normalizedAlt };
}

function extensionFor(type: MediaAssetRecord["contentType"]): string {
  return type === "image/jpeg" ? "jpg" : type.slice("image/".length);
}

async function digest(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "content.write");
  if (isAdminResponse(context)) return context;
  if (!context.identity.localPreview && !isMediaUploadEnabled()) return adminError(503, "Uploads ainda não foram ativados neste ambiente.");
  const bucket = getRuntimeMediaBucket();
  if (!bucket) return adminError(503, "Biblioteca de mídia indisponível.");
  let objectKey: string | null = null;
  try {
    const input = mediaInput(await request.formData());
    const image = sanitizeImageUpload(new Uint8Array(await input.file.arrayBuffer()));
    if (image.width * image.height > MAX_IMAGE_PIXELS) throw new Error("Imagem grande demais.");
    const id = crypto.randomUUID();
    objectKey = `media/${id}/original.${extensionFor(image.contentType)}`;
    const sanitizedBytes = Uint8Array.from(image.bytes);
    const asset = { id, objectKey, contentType: image.contentType, byteSize: sanitizedBytes.byteLength, altText: input.altText, width: image.width, height: image.height, sha256: await digest(sanitizedBytes) };
    await bucket.put(objectKey, sanitizedBytes.buffer, { httpMetadata: { contentType: image.contentType }, customMetadata: { assetId: id } });
    await saveMediaAsset(context, asset);
    return Response.json({ asset: { ...asset, url: `/api/admin/media/${id}`, lifecycleState: "staged" } }, { status: 201 });
  } catch (error) {
    if (objectKey) {
      try { await bucket.delete(objectKey); } catch (cleanupError) { console.error("Falha ao limpar upload sem registro D1.", cleanupError); }
    }
    return adminFailure(error, "media.upload");
  }
}

export async function GET(request: Request): Promise<Response> {
  const context = requireAdminRead(request, "content.read");
  if (isAdminResponse(context)) return context;
  try {
    const sql = "SELECT id, object_key, content_type, byte_size, alt_text, width, height, sha256, lifecycle_state, created_at FROM media_assets WHERE lifecycle_state <> 'archived' ORDER BY created_at DESC LIMIT 100";
    const result = await context.database.prepare(sql).all();
    return Response.json({ assets: result.results }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminFailure(error, "media.list");
  }
}
