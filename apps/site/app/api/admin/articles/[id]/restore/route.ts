import { restoreArticleRevision, revisionMediaObjectKeysForRestore } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminWrite } from "@/server/admin-api";
import { invalidInput } from "@/server/admin-errors";
import { getRuntimeMediaBucket } from "@/server/runtime-bindings";

type RouteContext = Readonly<{ params: Promise<Readonly<{ id: string }>> }>;

function restoreInput(value: unknown): Readonly<{ revisionId: string; expectedVersion: number }> {
  if (!value || typeof value !== "object") throw invalidInput("Dados de restauração inválidos.");
  const input = value as Readonly<Record<string, unknown>>;
  if (typeof input.revisionId !== "string" || !input.revisionId.trim()) throw invalidInput("Selecione uma revisão para restaurar.");
  if (!Number.isInteger(input.expectedVersion) || typeof input.expectedVersion !== "number" || input.expectedVersion < 1) throw invalidInput("Versão esperada inválida.");
  return { revisionId: input.revisionId, expectedVersion: input.expectedVersion };
}

export async function POST(request: Request, routeContext: RouteContext): Promise<Response> {
  const context = requireAdminWrite(request, "content.publish");
  if (isAdminResponse(context)) return context;
  try {
    const { id } = await routeContext.params;
    const input = restoreInput(await request.json());
    const objectKeys = await revisionMediaObjectKeysForRestore(context.database, id, input.revisionId);
    const bucket = getRuntimeMediaBucket();
    if (objectKeys.length > 0 && !bucket) throw new Error("Armazenamento de mídia indisponível para restauração.");
    for (const objectKey of objectKeys) {
      if (!await bucket?.get(objectKey)) throw invalidInput("Uma imagem desta revisão não está disponível no armazenamento.");
    }
    return Response.json(await restoreArticleRevision(context, id, input.revisionId, input.expectedVersion));
  } catch (error) {
    return adminFailure(error, "articles.revisions.restore");
  }
}
