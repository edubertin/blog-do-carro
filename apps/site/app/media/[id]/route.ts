import { getRuntimeDatabase, getRuntimeMediaBucket, isPublicD1ReadEnabled } from "@/server/runtime-bindings";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

export async function GET(request: Request, routeContext: RouteContext): Promise<Response> {
  if (!isPublicD1ReadEnabled()) return new Response(null, { status: 404 });
  const database = getRuntimeDatabase();
  const bucket = getRuntimeMediaBucket();
  if (!database || !bucket) return new Response(null, { status: 404 });
  const { id } = await routeContext.params;
  const row = await database.prepare("SELECT object_key, content_type, sha256 FROM media_assets WHERE id = ? AND lifecycle_state = 'published' LIMIT 1").bind(id).first();
  if (!row || typeof row.object_key !== "string" || typeof row.content_type !== "string") return new Response(null, { status: 404 });
  const object = await bucket.get(row.object_key);
  if (!object) return new Response(null, { status: 404 });
  const etag = typeof row.sha256 === "string" && row.sha256 ? `"${row.sha256}"` : `"media-${id}"`;
  const headers = { "Cache-Control": "public, max-age=31536000, immutable", "Content-Type": row.content_type, "ETag": etag, "X-Content-Type-Options": "nosniff" };
  if (request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}
