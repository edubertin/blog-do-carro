import hostingConfig from "../../../.openai/hosting.json" with { type: "json" };
import { adminConnectors } from "../admin-data";

export const RUNTIME_SOURCE_HEADER = "x-blog-do-carro-runtime-source";
export const RUNTIME_KEYS_HEADER = "x-blog-do-carro-runtime-configured-keys";
export const RUNTIME_BINDINGS_HEADER = "x-blog-do-carro-runtime-bindings";

export type RuntimeSource = "local" | "sites";
export type RuntimeBinding = "assets" | "images" | "d1" | "r2";

export type RuntimeInventory = Readonly<{
  source: RuntimeSource;
  configuredKeys: readonly string[];
  bindings: readonly RuntimeBinding[];
}>;

export type RuntimeEnvironment = Readonly<Record<string, unknown>>;

const environmentKeyPattern = /^[A-Z][A-Z0-9_]*$/u;
const foundationKeys = ["ADMIN_OWNER_USER_IDS", "ADMIN_EMAIL_BOOTSTRAP_ENABLED"] as const;

function uniqueEnvironmentKeys(): readonly string[] {
  const connectorKeys = adminConnectors.flatMap((connector) => [
    ...connector.requiredSettings,
    ...connector.requiredSecrets,
  ]);
  return [...new Set([...foundationKeys, ...connectorKeys])].filter((key) => environmentKeyPattern.test(key));
}

const approvedEnvironmentKeys = uniqueEnvironmentKeys();
const approvedEnvironmentKeySet = new Set(approvedEnvironmentKeys);

function configuredValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function normalizedBindingName(value: unknown): string | null {
  return typeof value === "string" && environmentKeyPattern.test(value) ? value : null;
}

function collectConfiguredKeys(environment: RuntimeEnvironment): readonly string[] {
  return approvedEnvironmentKeys.filter((key) => configuredValue(environment[key]));
}

function collectBindings(environment: RuntimeEnvironment): readonly RuntimeBinding[] {
  const bindings: RuntimeBinding[] = [];
  if (configuredValue(environment.ASSETS)) bindings.push("assets");
  if (configuredValue(environment.IMAGES)) bindings.push("images");
  const d1Binding = normalizedBindingName(hostingConfig.d1);
  const r2Binding = normalizedBindingName(hostingConfig.r2);
  if (d1Binding && configuredValue(environment[d1Binding])) bindings.push("d1");
  if (r2Binding && configuredValue(environment[r2Binding])) bindings.push("r2");
  return bindings;
}

function parseConfiguredKeys(value: string | null): readonly string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((item) => item.trim()).filter((item) => approvedEnvironmentKeySet.has(item)))];
}

function isRuntimeBinding(value: string): value is RuntimeBinding {
  return value === "assets" || value === "images" || value === "d1" || value === "r2";
}

function parseBindings(value: string | null): readonly RuntimeBinding[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((item) => item.trim()).filter(isRuntimeBinding))];
}

export function attachRuntimeInventory(
  headers: Headers,
  environment: RuntimeEnvironment,
  source: RuntimeSource,
): void {
  headers.delete(RUNTIME_SOURCE_HEADER);
  headers.delete(RUNTIME_KEYS_HEADER);
  headers.delete(RUNTIME_BINDINGS_HEADER);
  headers.set(RUNTIME_SOURCE_HEADER, source);
  headers.set(RUNTIME_KEYS_HEADER, collectConfiguredKeys(environment).join(","));
  headers.set(RUNTIME_BINDINGS_HEADER, collectBindings(environment).join(","));
}

export function readRuntimeInventory(headers: Readonly<{ get(name: string): string | null }>): RuntimeInventory {
  const source = headers.get(RUNTIME_SOURCE_HEADER) === "sites" ? "sites" : "local";
  return {
    source,
    configuredKeys: parseConfiguredKeys(headers.get(RUNTIME_KEYS_HEADER)),
    bindings: parseBindings(headers.get(RUNTIME_BINDINGS_HEADER)),
  };
}
