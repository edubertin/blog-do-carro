import { archiveArticle, getAdminArticle } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

export async function GET(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminRead(request, "content.read");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    return Response.json(await getAdminArticle(context.database, id));
  } catch (error) {
    return adminFailure(error, "articles.read");
  }
}

export async function DELETE(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminWrite(request, "content.write");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    await archiveArticle(context, id);
    return Response.json({ ok: true });
  } catch (error) {
    return adminFailure(error, "articles.archive");
  }
}
