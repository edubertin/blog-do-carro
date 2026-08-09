export const audiencePurposes = ["store_launch", "editorial_newsletter"] as const;
export type AudiencePurpose = (typeof audiencePurposes)[number];

export const audienceConsentVersion = "2026-08-09-v1";

export function isAudiencePurpose(value: unknown): value is AudiencePurpose {
  return typeof value === "string" && audiencePurposes.some((purpose) => purpose === value);
}

export function normalizeAudienceEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/\p{Cc}/u.test(value)) return null;
  const normalized = value.normalize("NFC").trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 254 || /[,;]/u.test(normalized)) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized) ? normalized : null;
}

export function normalizeSourcePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 160 || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.includes("\\") || /\p{Cc}/u.test(value)) return null;
  try {
    const parsed = new URL(value, "https://blog.invalid");
    return parsed.origin === "https://blog.invalid" ? `${parsed.pathname}${parsed.search}` : null;
  } catch {
    return null;
  }
}

export function consentText(purpose: AudiencePurpose): string {
  return purpose === "store_launch"
    ? "Quero receber por e-mail novidades e avisos de lançamento da Loja da Comunidade. Posso cancelar quando quiser."
    : "Quero receber artigos e novidades editoriais do Blog do Carro por e-mail. Posso cancelar quando quiser.";
}
