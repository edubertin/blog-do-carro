export const articleLifecycleStates = ["draft", "active", "archived"] as const;
export const articleRevisionStates = ["draft", "review", "scheduled", "published"] as const;
export const productStates = ["draft", "preview", "active", "archived"] as const;
export const inventoryStates = ["untracked", "available", "reserved", "unavailable"] as const;
export const storeModes = ["demo", "live"] as const;
export const storefrontModes = ["waitlist", "demo", "live"] as const;

export type ArticleLifecycleState = typeof articleLifecycleStates[number];
export type ArticleRevisionState = typeof articleRevisionStates[number];
export type ProductState = typeof productStates[number];
export type InventoryState = typeof inventoryStates[number];
export type StoreMode = typeof storeModes[number];

export type DatabaseDomain = "editorial" | "public_projection" | "catalog" | "commerce" | "control";
export type DataClassification = "public" | "operational" | "encrypted_pii" | "security_metadata";

export type DatabaseTableDefinition = Readonly<{
  name: string;
  domain: DatabaseDomain;
  classification: DataClassification;
  activation: "foundation" | "editorial" | "commerce";
}>;

export const databaseTables = [
  { name: "category_groups", domain: "editorial", classification: "public", activation: "foundation" },
  { name: "categories", domain: "editorial", classification: "public", activation: "foundation" },
  { name: "authors", domain: "editorial", classification: "public", activation: "editorial" },
  { name: "youtube_videos", domain: "editorial", classification: "public", activation: "foundation" },
  { name: "articles", domain: "editorial", classification: "operational", activation: "foundation" },
  { name: "article_revisions", domain: "editorial", classification: "operational", activation: "foundation" },
  { name: "article_revision_categories", domain: "editorial", classification: "operational", activation: "foundation" },
  { name: "article_revision_faqs", domain: "editorial", classification: "operational", activation: "foundation" },
  { name: "article_relations", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "published_article_projections", domain: "public_projection", classification: "public", activation: "editorial" },
  { name: "published_article_categories", domain: "public_projection", classification: "public", activation: "editorial" },
  { name: "menus", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "menu_items", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "home_sections", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "home_items", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "products", domain: "catalog", classification: "public", activation: "foundation" },
  { name: "product_variants", domain: "catalog", classification: "public", activation: "foundation" },
  { name: "inventory_balances", domain: "catalog", classification: "operational", activation: "commerce" },
  { name: "inventory_movements", domain: "catalog", classification: "operational", activation: "commerce" },
  { name: "store_settings", domain: "catalog", classification: "operational", activation: "foundation" },
  { name: "audience_contacts", domain: "commerce", classification: "encrypted_pii", activation: "commerce" },
  { name: "audience_subscriptions", domain: "commerce", classification: "operational", activation: "commerce" },
  { name: "audience_tokens", domain: "commerce", classification: "security_metadata", activation: "commerce" },
  { name: "audience_consent_events", domain: "commerce", classification: "security_metadata", activation: "commerce" },
  { name: "audience_request_limits", domain: "commerce", classification: "security_metadata", activation: "commerce" },
  { name: "media_assets", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "article_revision_media", domain: "editorial", classification: "operational", activation: "editorial" },
  { name: "admin_principals", domain: "control", classification: "security_metadata", activation: "editorial" },
  { name: "admin_role_assignments", domain: "control", classification: "security_metadata", activation: "editorial" },
  { name: "connector_configurations", domain: "control", classification: "security_metadata", activation: "foundation" },
  { name: "audit_events", domain: "control", classification: "security_metadata", activation: "editorial" },
  { name: "idempotency_records", domain: "control", classification: "security_metadata", activation: "editorial" },
] satisfies readonly DatabaseTableDefinition[];

export const deferredCommerceTables = [
  "customers",
  "customer_addresses",
  "customer_order_links",
  "orders",
  "order_private_details",
  "order_items",
  "order_status_events",
  "payments",
  "shipments",
  "webhook_events",
] as const;

export const databaseSchema = {
  version: 7,
  migration: "0007_audience_waitlist.sql",
  seed: "0001_foundation_seed.sql",
  bindingsDeclared: true,
  publicReadsEnabledByDefault: false,
  writesEnabledByDefault: false,
  tables: databaseTables,
} as const;
