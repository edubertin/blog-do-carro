import { confirmAudienceSubscription } from "@/server/audience-service";

const MAX_BODY_BYTES = 512;

function response(status: number, body: Readonly<Record<string, boolean>>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return response(403, { ok: false });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response(415, { ok: false });
  }
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return response(413, { ok: false });
    const body: unknown = JSON.parse(rawBody);
    const token = typeof body === "object" && body !== null && "token" in body ? body.token : null;
    const confirmed = await confirmAudienceSubscription(token);
    return response(confirmed ? 200 : 400, { ok: confirmed });
  } catch (error) {
    console.error(JSON.stringify({ event: "audience.confirmation.failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return response(400, { ok: false });
  }
}
