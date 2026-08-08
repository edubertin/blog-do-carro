import { adminError, adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { getRuntimeMediaBucket } from "@/server/runtime-bindings";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

export async function GET(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminRead(request, "content.read");
  if (isAdminResponse(context)) return context;
  const bucket = getRuntimeMediaBucket();
  if (!bucket) return adminError(503, "Biblioteca de mÃ­dia indisponÃ­vel.");
  try {
    const { id } = await routeContext.params;
    const row = await context.database.prepare("SELECT object_key, content_type FROM media_assets WHERE id = ? AND lifecycle_state <> 'archived' LIMIT 1").bind(id).first();
    if (!row || typeof row.object_key !== "string" || typeof row.content_type !== "string") return adminError(404, "MÃ­dia nÃ£o encontrada.");
    const object = await bucket.get(row.object_key);
    if (!object) return adminError(404, "MÃ­dia nÃ£o encontrada.");
    return new Response(object.body, { headers: { "Cache-Control": "private, no-store", "Content-Type": row.content_type } });
  } catch (error) {
    return adminFailure(error, "media.read");
  }
}

export async function DELETE(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminWrite(request, "content.write");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    const reference = await context.database.prepare("SELECT 1 AS found FROM article_revision_media WHERE media_asset_id = ? LIMIT 1").bind(id).first();
    if (reference) return adminError(409, "A imagem está vinculada a uma revisão e não pode ser arquivada.");
    const row = await context.database.prepare("SELECT id FROM media_assets WHERE id = ? AND lifecycle_state = 'staged' LIMIT 1").bind(id).first();
    if (!row) return adminError(404, "Mídia staged não encontrada.");
    await context.database.prepare("UPDATE media_assets SET lifecycle_state = 'archived', updated_at = ? WHERE id = ?").bind(Date.now(), id).run();
    return new Response(null, { status: 204 });
  } catch (error) {
    return adminFailure(error, "media.archive");
  }
}
