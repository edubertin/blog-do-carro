import { submitArticleForReview } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminWrite } from "@/server/admin-api";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

export async function POST(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminWrite(request, "content.review");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    await submitArticleForReview(context, id);
    return Response.json({ ok: true });
  } catch (error) {
    return adminFailure(error, "articles.review");
  }
}
