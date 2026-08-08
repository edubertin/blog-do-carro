import { createArticleDraft, listAdminArticles } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { parseArticleDraftInput } from "@/server/admin-input";

export async function GET(request: Request): Promise<Response> {
  const context = requireAdminRead(request, "content.read");
  if (isAdminResponse(context)) return context;
  try {
    return Response.json({ articles: await listAdminArticles(context.database) });
  } catch (error) {
    return adminFailure(error, "articles.list");
  }
}

export async function POST(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "content.write");
  if (isAdminResponse(context)) return context;
  try {
    const input = parseArticleDraftInput(await request.json());
    return Response.json({ article: await createArticleDraft(context, input) }, { status: input.articleId ? 200 : 201 });
  } catch (error) {
    return adminFailure(error, "articles.create");
  }
}
