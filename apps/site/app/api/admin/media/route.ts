import { saveMediaAsset } from "@/db/repositories/d1-admin-repository";
import { adminError, adminFailure, isAdminResponse, requireAdminWrite } from "@/server/admin-api";
import { getRuntimeMediaBucket, isMediaUploadEnabled } from "@/server/runtime-bindings";
import type { MediaAssetRecord } from "@/db/admin-contracts";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function detectedImageType(bytes: Uint8Array): MediaAssetRecord["contentType"] | null {
  const png = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (png) return "image/png";
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (jpeg) return "image/jpeg";
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return webp ? "image/webp" : null;
}

function extensionFor(contentType: MediaAssetRecord["contentType"]): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  return "webp";
}

function mediaInput(form: FormData): Readonly<{ file: File; altText: string }> {
  const file = form.get("file");
  const altText = form.get("altText");
  if (!(file instanceof File) || typeof altText !== "string") throw new Error("Arquivo e texto alternativo sÃ£o obrigatÃ³rios.");
  const normalizedAlt = altText.trim();
  if (!normalizedAlt || normalizedAlt.length > 240) throw new Error("Texto alternativo invÃ¡lido.");
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error("A imagem deve ter atÃ© 5 MB.");
  return { file, altText: normalizedAlt };
}

export async function POST(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "content.write");
  if (isAdminResponse(context)) return context;
  if (!context.identity.localPreview && !isMediaUploadEnabled()) return adminError(503, "Uploads ainda nÃ£o foram ativados neste ambiente.");
  const bucket = getRuntimeMediaBucket();
  if (!bucket) return adminError(503, "Biblioteca de mÃ­dia indisponÃ­vel.");
  let objectKey: string | null = null;
  try {
    const { file, altText } = mediaInput(await request.formData());
    const buffer = await file.arrayBuffer();
    const contentType = detectedImageType(new Uint8Array(buffer));
    if (!contentType) throw new Error("Formato real da imagem nÃ£o permitido.");
    const id = crypto.randomUUID();
    objectKey = `staged/${id}.${extensionFor(contentType)}`;
    await bucket.put(objectKey, buffer, { httpMetadata: { contentType }, customMetadata: { assetId: id } });
    await saveMediaAsset(context, { id, objectKey, contentType, byteSize: file.size, altText });
    return Response.json({ asset: { id, url: `/api/admin/media/${id}`, altText } }, { status: 201 });
  } catch (error) {
    if (objectKey) await bucket.delete(objectKey);
    return adminFailure(error, "media.upload");
  }
}
