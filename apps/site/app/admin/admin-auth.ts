import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminSignInPath,
  hasAdminPermission,
  hasMatchingRequestOrigin,
  resolveForwardedAdminAccess,
} from "./admin-auth-core";
import type { AdminAccess, AdminIdentity, AdminPermission } from "./admin-auth-core";

export async function getAdminPageAccess(): Promise<AdminAccess> {
  const requestHeaders = await headers();
  return resolveForwardedAdminAccess(requestHeaders);
}

export async function requireAdminPage(permission: AdminPermission): Promise<AdminIdentity | null> {
  const access = await getAdminPageAccess();
  if (access.kind === "anonymous") redirect(adminSignInPath("/admin"));
  if (access.kind !== "allowed") return null;
  return hasAdminPermission(access.identity, permission) ? access.identity : null;
}

export function getAdminRequestAccess(request: Request): AdminAccess {
  return resolveForwardedAdminAccess(request.headers);
}

export function authorizeAdminRequest(
  request: Request,
  permission: AdminPermission,
): AdminIdentity | null {
  const access = getAdminRequestAccess(request);
  if (access.kind !== "allowed") return null;
  return hasAdminPermission(access.identity, permission) ? access.identity : null;
}

export function authorizeAdminMutation(
  request: Request,
  permission: AdminPermission,
): AdminIdentity | null {
  if (!hasMatchingRequestOrigin(request)) return null;
  return authorizeAdminRequest(request, permission);
}
