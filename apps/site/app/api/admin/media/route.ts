import type { MediaAssetRecord } from "@/db/admin-contracts";
import { saveMediaAsset } from "@/db/repositories/d1-admin-repository";
import { adminError, adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { getRuntimeMediaBucket, isMediaUploadEnabled } from "@/server/runtime-bindings";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

function detectedImageType(bytes: Uint8Array): MediaAssetRecord["contentType"] | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 10 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const riff = bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF";
  return riff && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" ? "image/webp" : null;
}

function uint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 256 + (bytes[offset + 1] ?? 0);
}

function uint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

function jpegDimensions(bytes: Uint8Array): readonly [number, number] | null {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1] ?? 0;
    const length = uint16(bytes, offset + 2);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return [uint16(bytes, offset + 7), uint16(bytes, offset + 5)];
    if (length < 2) return null;
    offset += length + 2;
  }
  return null;
}

function imageDimensions(bytes: Uint8Array, type: MediaAssetRecord["contentType"]): readonly [number, number] | null {
  if (type === "image/png") return [uint32(bytes, 16), uint32(bytes, 20)];
  if (type === "image/jpeg") return jpegDimensions(bytes);
  const format = String.fromCharCode(...bytes.slice(12, 16));
  if (format === "VP8X") {
    const width = 1 + (bytes[24] ?? 0) + ((bytes[25] ?? 0) << 8) + ((bytes[26] ?? 0) << 16);
    const height = 1 + (bytes[27] ?? 0) + ((bytes[28] ?? 0) << 8) + ((bytes[29] ?? 0) << 16);
    return [width, height];
  }
  if (format === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = ((bytes[26] ?? 0) | ((bytes[27] ?? 0) << 8)) & 0x3fff;
    const height = ((bytes[28] ?? 0) | ((bytes[29] ?? 0) << 8)) & 0x3fff;
    return [width, height];
  }
  if (format !== "VP8L" || bytes[20] !== 0x2f) return null;
  const width = 1 + (bytes[21] ?? 0) + (((bytes[22] ?? 0) & 0x3f) << 8);
  const height = 1 + ((bytes[22] ?? 0) >> 6) + ((bytes[23] ?? 0) << 2) + (((bytes[24] ?? 0) & 0x0f) << 10);
  return [width, height];
}

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

async function digest(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
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
    const buffer = await input.file.arrayBuffer();
    const contentType = detectedImageType(new Uint8Array(buffer));
    if (!contentType) throw new Error("Formato real da imagem não permitido.");
    const dimensions = imageDimensions(new Uint8Array(buffer), contentType);
    if (!dimensions || dimensions[0] * dimensions[1] > MAX_IMAGE_PIXELS) throw new Error("Imagem corrompida ou grande demais.");
    const id = crypto.randomUUID();
    objectKey = `media/${id}/original.${extensionFor(contentType)}`;
    const asset = { id, objectKey, contentType, byteSize: input.file.size, altText: input.altText, width: dimensions[0], height: dimensions[1], sha256: await digest(buffer) };
    await bucket.put(objectKey, buffer, { httpMetadata: { contentType }, customMetadata: { assetId: id } });
    await saveMediaAsset(context, asset);
    return Response.json({ asset: { ...asset, url: `/api/admin/media/${id}`, lifecycleState: "staged" } }, { status: 201 });
  } catch (error) {
    if (objectKey) await bucket.delete(objectKey);
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
