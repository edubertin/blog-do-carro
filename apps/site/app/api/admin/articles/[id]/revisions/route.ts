import { listArticleRevisions } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminRead } from "@/server/admin-api";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

export async function GET(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminRead(request, "content.read");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    return Response.json({ revisions: await listArticleRevisions(context.database, id) });
  } catch (error) {
    return adminFailure(error, "articles.revisions.list");
  }
}
