import { requestAudienceSubscription } from "@/server/audience-service";

const MAX_BODY_BYTES = 8_192;

function response(status: number, body: Readonly<Record<string, string>>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return response(403, { error: "Origem inválida." });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response(415, { error: "Formato inválido." });
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(length) || length > MAX_BODY_BYTES) return response(413, { error: "Conteúdo muito grande." });
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return response(413, { error: "Conteúdo muito grande." });
    }
    const payload: unknown = JSON.parse(rawBody);
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return response(422, { error: "Dados inválidos." });
    const remoteAddress = request.headers.get("cf-connecting-ip");
    const result = await requestAudienceSubscription(payload, { origin, remoteAddress });
    if (result === "unavailable") return response(503, { error: "A lista ainda não está disponível." });
    if (result === "invalid") return response(422, { error: "Revise o e-mail e o consentimento." });
    if (result === "challenge_failed") return response(422, { error: "Não foi possível validar o envio. Tente novamente." });
    if (result === "rate_limited") return Response.json({ error: "Tente novamente em alguns minutos." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "600" } });
    return response(202, { message: "Confira seu e-mail para confirmar a inscrição." });
  } catch (error) {
    console.error(JSON.stringify({ event: "audience.subscription.failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return response(503, { error: "Não foi possível concluir agora. Tente novamente." });
  }
}
