import { searchPublishedArticles } from "@/server/public-content-service";

const minimumQueryLength = 2;
const maximumQueryLength = 80;

function response(results: Awaited<ReturnType<typeof searchPublishedArticles>>): Response {
  return Response.json(
    { results },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < minimumQueryLength) return response([]);
  if (query.length > maximumQueryLength) {
    return Response.json(
      { error: "A busca aceita no máximo 80 caracteres." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return response(await searchPublishedArticles(query, 8));
}
