import {
  adminSignInPath,
  hasMatchingRequestOrigin,
  isLoopbackHost,
  resolveAdminAccess,
} from "../app/admin/admin-auth-core";

export type AdminAuthEnvironment = Readonly<{
  ADMIN_OWNER_USER_IDS?: string;
  ADMIN_OWNER_EMAIL_ALLOWLIST?: string;
  ADMIN_EMAIL_BOOTSTRAP_ENABLED?: string;
}>;

function isAdminPagePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

export function isProtectedAdminPath(pathname: string): boolean {
  return isAdminPagePath(pathname) || isAdminApiPath(pathname);
}

export function isLocalPreviewUrl(url: URL): boolean {
  return url.protocol === "http:" && isLoopbackHost(url.host);
}

function failureResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}

function signInResponse(url: URL): Response {
  const returnTo = `${url.pathname}${url.search}`;
  const destination = new URL(adminSignInPath(returnTo), url.origin);
  return new Response(null, {
    status: 307,
    headers: { "Cache-Control": "private, no-store", Location: destination.toString() },
  });
}

export function adminGateResponse(
  request: Request,
  env: AdminAuthEnvironment,
  url: URL,
): Response | null {
  const access = resolveAdminAccess(request.headers, isLocalPreviewUrl(url) ? url.host : null, {
    userIds: env.ADMIN_OWNER_USER_IDS,
    emailAllowlist: env.ADMIN_OWNER_EMAIL_ALLOWLIST,
    emailBootstrapEnabled: env.ADMIN_EMAIL_BOOTSTRAP_ENABLED === "1",
  });
  if (access.kind === "misconfigured") return failureResponse(503, "Admin authentication unavailable");
  if (access.kind === "denied") return failureResponse(403, "Forbidden");
  if (access.kind === "anonymous") {
    const mayRedirect = isAdminPagePath(url.pathname) && ["GET", "HEAD"].includes(request.method);
    return mayRedirect ? signInResponse(url) : failureResponse(401, "Unauthorized");
  }
  if (!["GET", "HEAD"].includes(request.method) && !hasMatchingRequestOrigin(request)) {
    return failureResponse(403, "Forbidden");
  }
  return null;
}
