export const SITES_USER_ID_HEADER = "oai-authenticated-user-id";
export const LOCAL_PREVIEW_HEADER = "x-blog-do-carro-local-preview";
export const ADMIN_AUTHORIZED_HEADER = "x-blog-do-carro-admin-authorized";

const SITES_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const SITES_FULL_NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";
const SITES_EMAIL_HEADER = "oai-authenticated-user-email";
const SITES_PERCENT_ENCODING = "percent-encoded-utf-8";
const AUTH_PATHS = ["/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"] as const;
const MAX_OWNER_CONFIG_LENGTH = 2_048;
const MAX_OWNER_ENTRIES = 32;
const MAX_DISPLAY_NAME_LENGTH = 120;
const EMAIL_PATTERN = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/u;

export type AdminRole = "owner";

export type AdminPermission =
  | "content.read"
  | "content.write"
  | "content.review"
  | "content.publish"
  | "home.read"
  | "home.write"
  | "home.publish"
  | "catalog.read"
  | "catalog.write"
  | "catalog.activate"
  | "orders.read"
  | "orders.update"
  | "customer_pii.read"
  | "analytics.read"
  | "connectors.read"
  | "connectors.test"
  | "connectors.activate"
  | "flags.read"
  | "flags.change"
  | "admin_users.manage"
  | "audit.read";

export type AdminIdentity = Readonly<{
  actorId: string;
  displayName: string;
  role: AdminRole;
  localPreview: boolean;
}>;

export type AdminAccess =
  | Readonly<{ kind: "allowed"; identity: AdminIdentity }>
  | Readonly<{ kind: "anonymous" }>
  | Readonly<{ kind: "denied" }>
  | Readonly<{ kind: "misconfigured" }>;

export type HeaderReader = Readonly<{
  get(name: string): string | null;
}>;

export type OwnerBootstrap = Readonly<{
  userIds?: string;
  emailAllowlist?: string;
  emailBootstrapEnabled?: boolean;
}>;

function normalizedHostname(host: string | null): string | null {
  if (!host || host.length > 255) return null;
  try {
    const parsed = new URL(`http://${host.trim()}`);
    if (parsed.username || parsed.password || parsed.pathname !== "/") return null;
    return parsed.hostname.toLowerCase().replace(/^\[|\]$/gu, "");
  } catch {
    return null;
  }
}

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

function isOpaqueId(value: string): boolean {
  return value.length <= 256 && value.length > 0 && !/[\s,]/u.test(value) && !containsControlCharacter(value);
}

export function isLoopbackHost(host: string | null): boolean {
  const hostname = normalizedHostname(host);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function configEntries(config: string): unknown {
  if (config.trim().startsWith("[")) return JSON.parse(config);
  return config.split(",").map((value) => value.trim()).filter(Boolean);
}

function parseAllowlist(
  config: string | undefined,
  validator: (value: string) => boolean,
  normalize: (value: string) => string = (value) => value,
): readonly string[] | null {
  if (config === undefined) return [];
  if (config.length > MAX_OWNER_CONFIG_LENGTH) return null;
  try {
    const parsed = configEntries(config);
    if (!Array.isArray(parsed) || parsed.length > MAX_OWNER_ENTRIES) return null;
    if (!parsed.every((value) => typeof value === "string")) return null;
    const normalized = parsed.map((value) => normalize(value));
    if (!normalized.every(validator)) return null;
    return new Set(normalized).size === normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

function normalizedEmail(headers: HeaderReader): string | null {
  const email = headers.get(SITES_EMAIL_HEADER)?.trim().toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

function decodedDisplayName(headers: HeaderReader): string {
  const rawName = headers.get(SITES_FULL_NAME_HEADER);
  if (!rawName) return "Administrador";
  try {
    const encoding = headers.get(SITES_FULL_NAME_ENCODING_HEADER);
    const decoded = encoding === SITES_PERCENT_ENCODING ? decodeURIComponent(rawName) : rawName;
    const normalized = decoded.trim();
    if (!normalized || normalized.length > MAX_DISPLAY_NAME_LENGTH) return "Administrador";
    return containsControlCharacter(normalized) ? "Administrador" : normalized;
  } catch {
    return "Administrador";
  }
}

function localPreviewIdentity(): AdminIdentity {
  return { actorId: "local-preview", displayName: "Prévia local", role: "owner", localPreview: true };
}

export function resolveAdminAccess(
  headers: HeaderReader,
  host: string | null,
  bootstrap: OwnerBootstrap,
): AdminAccess {
  if (isLoopbackHost(host)) return { kind: "allowed", identity: localPreviewIdentity() };
  const ownerIds = parseAllowlist(bootstrap.userIds, isOpaqueId);
  const ownerEmails = bootstrap.emailBootstrapEnabled
    ? parseAllowlist(
        bootstrap.emailAllowlist,
        (value) => EMAIL_PATTERN.test(value),
        (value) => value.trim().toLowerCase(),
      )
    : [];
  if (!ownerIds || !ownerEmails || ownerIds.length + ownerEmails.length === 0) return { kind: "misconfigured" };
  const actorId = headers.get(SITES_USER_ID_HEADER);
  if (actorId === null || actorId === "") return { kind: "anonymous" };
  if (!isOpaqueId(actorId)) return { kind: "denied" };
  const email = normalizedEmail(headers);
  const authorized = ownerIds.includes(actorId) || (email !== null && ownerEmails.includes(email));
  if (!authorized) return { kind: "denied" };
  return {
    kind: "allowed",
    identity: { actorId, displayName: decodedDisplayName(headers), role: "owner", localPreview: false },
  };
}

export function resolveForwardedAdminAccess(headers: HeaderReader): AdminAccess {
  if (headers.get(ADMIN_AUTHORIZED_HEADER) !== "owner") return { kind: "denied" };
  if (headers.get(LOCAL_PREVIEW_HEADER) === "1") {
    return { kind: "allowed", identity: localPreviewIdentity() };
  }
  const actorId = headers.get(SITES_USER_ID_HEADER);
  if (!actorId || !isOpaqueId(actorId)) return { kind: "denied" };
  return {
    kind: "allowed",
    identity: { actorId, displayName: decodedDisplayName(headers), role: "owner", localPreview: false },
  };
}

export function hasAdminPermission(identity: AdminIdentity, permission: AdminPermission): boolean {
  void permission;
  return identity.role === "owner";
}

function safeReturnPath(candidate: string, fallback: string): string {
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  if (/\p{Cc}/u.test(candidate)) return fallback;
  try {
    const parsed = new URL(candidate, "https://admin.invalid");
    if (parsed.origin !== "https://admin.invalid") return fallback;
    if (AUTH_PATHS.some((path) => parsed.pathname === path)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function adminSignInPath(returnTo = "/admin"): string {
  const safePath = safeReturnPath(returnTo, "/admin");
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(safePath)}`;
}

export function adminSignOutPath(returnTo = "/"): string {
  const safePath = safeReturnPath(returnTo, "/");
  return `/signout-with-chatgpt?return_to=${encodeURIComponent(safePath)}`;
}

export function hasMatchingRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
