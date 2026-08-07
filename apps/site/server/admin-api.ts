import { authorizeAdminMutation, authorizeAdminRequest } from "../app/admin/admin-auth";
import type { AdminIdentity, AdminPermission } from "../app/admin/admin-auth-core";
import type { D1Database } from "../db/d1";
import type { AdminWriteContext } from "../db/repositories/d1-admin-repository";
import { getAdminSubjectHmacKey, getRuntimeDatabase, isCmsWriteEnabled } from "./runtime-bindings";
import { AdminExpectedError } from "./admin-errors";

export type AdminReadContext = Readonly<{ database: D1Database; identity: AdminIdentity }>;

function requestId(request: Request): string {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[A-Za-z0-9._-]{8,80}$/u.test(supplied) ? supplied : crypto.randomUUID();
}

function environmentFor(request: Request, identity: AdminIdentity): AdminWriteContext["environment"] {
  if (identity.localPreview) return "local";
  return new URL(request.url).hostname === "blogdocarro.com" ? "production" : "preview";
}

export function adminError(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function adminFailure(error: unknown, operation: string): Response {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(JSON.stringify({ event: "admin.operation.failed", errorName, operation }));
  if (error instanceof AdminExpectedError) return adminError(error.status, error.message);
  return adminError(500, "A operação não pôde ser concluída.");
}

export function requireAdminRead(request: Request, permission: AdminPermission): AdminReadContext | Response {
  const identity = authorizeAdminRequest(request, permission);
  if (!identity) return adminError(403, "Acesso negado.");
  const database = getRuntimeDatabase();
  if (!database) return adminError(503, "Banco editorial indisponível.");
  return { database, identity };
}

export function requireAdminWrite(request: Request, permission: AdminPermission): AdminWriteContext | Response {
  const identity = authorizeAdminMutation(request, permission);
  if (!identity) return adminError(403, "Acesso negado.");
  if (!identity.localPreview && !isCmsWriteEnabled()) return adminError(503, "Escritas editoriais ainda não foram ativadas neste ambiente.");
  const database = getRuntimeDatabase();
  if (!database) return adminError(503, "Banco editorial indisponível.");
  return {
    database,
    identity,
    requestId: requestId(request),
    environment: environmentFor(request, identity),
    hmacKey: getAdminSubjectHmacKey(),
  };
}

export function isAdminResponse(value: AdminReadContext | AdminWriteContext | Response): value is Response {
  return value instanceof Response;
}
