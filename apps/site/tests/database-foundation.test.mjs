import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const foundationMigrationSql = readFileSync(new URL("../drizzle/0001_d1_foundation.sql", import.meta.url), "utf8");
const cmsMigrationSql = readFileSync(new URL("../drizzle/0002_cms_media.sql", import.meta.url), "utf8");
const catalogMigrationSql = readFileSync(new URL("../drizzle/0003_community_store_catalog.sql", import.meta.url), "utf8");
const structuredMediaMigrationSql = readFileSync(new URL("../drizzle/0004_structured_article_media.sql", import.meta.url), "utf8");
const storefrontMigrationSql = readFileSync(new URL("../drizzle/0005_storefront_refresh.sql", import.meta.url), "utf8");
const seedSql = readFileSync(new URL("../drizzle/0001_foundation_seed.sql", import.meta.url), "utf8");
const hostingConfig = JSON.parse(readFileSync(new URL("../.openai/hosting.json", import.meta.url), "utf8"));

function foundationDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(foundationMigrationSql);
  database.exec(seedSql);
  database.exec(cmsMigrationSql);
  database.exec(catalogMigrationSql);
  database.exec(structuredMediaMigrationSql);
  database.exec(storefrontMigrationSql);
  return database;
}

function tableNames(database) {
  return database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name").all()
    .map((row) => row.name);
}

test("applies the D1 foundation migration to an empty SQLite database", () => {
  const database = foundationDatabase();
  const tables = tableNames(database);
  for (const table of [
    "articles",
    "article_revisions",
    "published_article_projections",
    "products",
    "product_variants",
    "inventory_movements",
    "connector_configurations",
    "audit_events",
    "idempotency_records",
    "media_assets",
    "article_revision_media",
  ]) {
    assert.ok(tables.includes(table), `missing table ${table}`);
  }
  for (const deferred of ["customers", "orders", "payments", "shipments", "webhook_events"]) {
    assert.ok(!tables.includes(deferred), `deferred commerce table was created: ${deferred}`);
  }
});

test("seeds only non-sensitive editorial and preview catalog data", () => {
  const database = foundationDatabase();
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM categories").get().count, 10);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM youtube_videos").get().count, 4);
  assert.equal(database.prepare("SELECT lifecycle_state FROM articles").get().lifecycle_state, "draft");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM published_article_projections").get().count, 0);
  assert.deepEqual(
    database.prepare("SELECT slug FROM products ORDER BY updated_at DESC").all().map((row) => row.slug),
    ["chaveiro-blog-do-carro", "miniatura-blog-do-carro"],
  );
  assert.deepEqual(
    database.prepare("SELECT price_cents FROM product_variants ORDER BY price_cents").all().map((row) => row.price_cents),
    [990, 4990],
  );
  assert.deepEqual(
    database.prepare("SELECT slug, status FROM products ORDER BY slug").all().map((row) => [row.slug, row.status]),
    [["chaveiro-blog-do-carro", "active"], ["miniatura-blog-do-carro", "preview"]],
  );
  assert.equal(database.prepare("SELECT active FROM menu_items WHERE href = '/#categorias'").get().active, 0);
  assert.deepEqual(
    { ...database.prepare("SELECT mode, checkout_enabled FROM store_settings WHERE id = 1").get() },
    { mode: "demo", checkout_enabled: 0 },
  );
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM admin_principals").get().count, 0);
});

test("enforces catalog, publication and identity constraints", () => {
  const database = foundationDatabase();
  assert.throws(() => database.exec("UPDATE store_settings SET checkout_enabled = 1 WHERE id = 1"));
  assert.throws(() => database.exec("UPDATE product_variants SET price_cents = -1 WHERE id = 'var_chp_demo_ed01'"));
  assert.throws(() => database.exec("INSERT INTO article_revision_categories VALUES ('rev_moto_spin_001', 'cat_dicas', 1)"));
  assert.throws(() => database.exec("INSERT INTO youtube_videos VALUES ('duplicate', 'youtube', 'jT0j_rCgbbc', '@negociobaum', 'Duplicado', NULL, '/poster.png', 'detected', 0, NULL)"));
});

test("keeps audit and inventory ledgers append-only", () => {
  const database = foundationDatabase();
  database.exec("INSERT INTO audit_events (id, occurred_at, request_id, actor_kind, action, resource_type, environment, result) VALUES ('audit-1', 1, 'request-1', 'system', 'schema.tested', 'database', 'local', 'allowed')");
  assert.throws(() => database.exec("UPDATE audit_events SET result = 'failed' WHERE id = 'audit-1'"));
  assert.throws(() => database.exec("DELETE FROM audit_events WHERE id = 'audit-1'"));
  database.exec("INSERT INTO inventory_movements (id, variant_id, quantity_delta, movement_type, reason_code, idempotency_key, created_at) VALUES ('move-1', 'var_chp_demo_ed01', 1, 'adjust', 'schema-test', 'movement-test-1', 1)");
  assert.throws(() => database.exec("UPDATE inventory_movements SET quantity_delta = 2 WHERE id = 'move-1'"));
});

test("creates indexes for published content and operational queues", () => {
  const database = foundationDatabase();
  const plan = database.prepare("EXPLAIN QUERY PLAN SELECT article_id FROM published_article_projections WHERE category_slug = ? ORDER BY published_at DESC").all("negociacoes");
  assert.match(plan.map((row) => row.detail).join(" "), /idx_published_article_projections_category/i);
  const indexes = database.prepare("SELECT name FROM sqlite_schema WHERE type = 'index'").all().map((row) => row.name);
  assert.ok(indexes.includes("idx_article_revisions_scheduled"));
  assert.ok(indexes.includes("idx_audit_events_failures"));
});

test("preserves unknown publication dates and normalized public search fields", () => {
  const database = foundationDatabase();
  const columns = database.prepare("PRAGMA table_info(published_article_projections)").all();
  const byName = new Map(columns.map((column) => [column.name, column]));
  assert.equal(byName.get("published_at").notnull, 0);
  assert.equal(byName.get("search_text").notnull, 1);
  const productColumns = database.prepare("PRAGMA table_info(products)").all();
  assert.ok(productColumns.some((column) => column.name === "primary_image_alt" && column.notnull === 1));
});

test("declares logical Sites bindings without credentials or PII", () => {
  assert.equal(hostingConfig.d1, "DB");
  assert.equal(hostingConfig.r2, "MEDIA");
  assert.doesNotMatch(seedSql, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  assert.doesNotMatch(seedSql, /(?:api[_-]?key|access[_-]?token|private[_-]?key|password)\s*[=:]/iu);
  assert.doesNotMatch(seedSql, /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+/u);
});

test("upgrades existing editorial rows and constrains staged media", () => {
  const database = foundationDatabase();
  const revision = database.prepare("SELECT version, updated_at FROM article_revisions WHERE id = 'rev_moto_spin_001'").get();
  assert.deepEqual({ ...revision }, { version: 1, updated_at: 0 });
  database.exec("INSERT INTO media_assets (id, object_key, content_type, byte_size, alt_text, lifecycle_state, created_at, updated_at) VALUES ('media-1', 'staged/media-1.webp', 'image/webp', 1200, 'Imagem de teste', 'staged', 1, 1)");
  assert.throws(() => database.exec("INSERT INTO media_assets (id, object_key, content_type, byte_size, alt_text, lifecycle_state, created_at, updated_at) VALUES ('media-2', 'staged/media-2.svg', 'image/svg+xml', 1200, 'SVG', 'staged', 1, 1)"));
});

test("links structured article media without allowing referenced assets to be deleted", () => {
  const database = foundationDatabase();
  database.exec("INSERT INTO media_assets (id, object_key, content_type, byte_size, alt_text, lifecycle_state, created_at, updated_at, width, height, sha256) VALUES ('media-linked', 'media/media-linked/original.webp', 'image/webp', 1200, 'Imagem de teste', 'staged', 1, 1, 1200, 800, 'abc')");
  database.exec("INSERT INTO article_revision_media (revision_id, media_asset_id, usage, block_id, position, alt_text) VALUES ('rev_moto_spin_001', 'media-linked', 'inline', 'block-1', 1, 'Imagem de teste')");
  assert.throws(() => database.exec("DELETE FROM media_assets WHERE id = 'media-linked'"));
  database.exec("INSERT INTO media_assets (id, object_key, content_type, byte_size, alt_text, lifecycle_state, created_at, updated_at, width, height, sha256) VALUES ('media-cover', 'media/media-cover/original.webp', 'image/webp', 1200, 'Capa do artigo', 'staged', 1, 1, 1200, 800, 'def')");
  database.exec("INSERT INTO article_revision_media (revision_id, media_asset_id, usage, block_id, position, alt_text) VALUES ('rev_moto_spin_001', 'media-cover', 'cover', 'cover', 0, 'Capa do artigo')");
});
