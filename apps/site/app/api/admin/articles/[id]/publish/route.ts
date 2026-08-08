import { publishArticle, revisionMediaObjectKeys } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminWrite } from "@/server/admin-api";
import { getRuntimeMediaBucket } from "@/server/runtime-bindings";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

export async function POST(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminWrite(request, "content.publish");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    const objectKeys = await revisionMediaObjectKeys(context.database, id);
    const bucket = getRuntimeMediaBucket();
    if (objectKeys.length > 0 && !bucket) throw new Error("Armazenamento de mídia indisponível para publicação.");
    for (const objectKey of objectKeys) {
      if (!await bucket?.get(objectKey)) throw new Error("Uma imagem do artigo não está disponível no armazenamento.");
    }
    await publishArticle(context, id);
    return Response.json({ ok: true });
  } catch (error) {
    return adminFailure(error, "articles.publish");
  }
}
