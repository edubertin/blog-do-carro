import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { readFile } from "node:fs/promises";

const foundationMigrationSql = readFileSync(new URL("../drizzle/0001_d1_foundation.sql", import.meta.url), "utf8");
const cmsMigrationSql = readFileSync(new URL("../drizzle/0002_cms_media.sql", import.meta.url), "utf8");
const catalogMigrationSql = readFileSync(new URL("../drizzle/0003_community_store_catalog.sql", import.meta.url), "utf8");
const structuredMediaMigrationSql = readFileSync(new URL("../drizzle/0004_structured_article_media.sql", import.meta.url), "utf8");
const storefrontMigrationSql = readFileSync(new URL("../drizzle/0005_storefront_refresh.sql", import.meta.url), "utf8");
const pendingYouTubeMigrationSql = readFileSync(new URL("../drizzle/0006_pending_youtube_videos.sql", import.meta.url), "utf8");
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
  database.exec(pendingYouTubeMigrationSql);
  return database;
}

function prePendingVideoDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(foundationMigrationSql);
  database.exec(seedSql);
  database.exec(cmsMigrationSql);
  database.exec(catalogMigrationSql);
  database.exec(structuredMediaMigrationSql);
  database.exec(storefrontMigrationSql);
  return database;
}

function insertLegacyProjection(database) {
  database.exec(`INSERT INTO published_article_projections (
    article_id, revision_id, slug, category_name, category_slug, title, subtitle,
    seo_description, search_text, image_url, image_alt, youtube_video_external_id,
    date_label, body_json, opinion, faq_json, read_time_minutes, updated_at
  ) SELECT a.id, r.id, a.slug, 'Negociações', 'negociacoes', r.title, r.subtitle,
    r.seo_description, 'busca', r.image_url, r.image_alt, y.external_id,
    'PUBLICADO', r.body_json, r.opinion, '[{"question":"Pergunta?","answer":"Resposta."}]',
    r.read_time_minutes, 1
  FROM articles a
  JOIN article_revisions r ON r.id = a.working_revision_id
  JOIN youtube_videos y ON y.id = a.source_video_id
  WHERE a.id = 'art_moto_spin_financiada'`);
}

class SQLiteD1Statement {
  constructor(database, query, values = []) {
    this.database = database;
    this.query = query;
    this.values = values;
  }

  bind(...values) { return new SQLiteD1Statement(this.database, this.query, values); }
  async first() { return this.database.prepare(this.query).get(...this.values) ?? null; }
  async all() { return { success: true, results: this.database.prepare(this.query).all(...this.values) }; }
  async run() { this.database.prepare(this.query).run(...this.values); return { success: true, results: [] }; }
}

class SQLiteD1Database {
  constructor(database) { this.database = database; }
  prepare(query) { return new SQLiteD1Statement(this.database, query); }
  async batch(statements) {
    this.database.exec("BEGIN");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

async function typescriptModuleUrl(sourceUrl, cache = new Map()) {
  const cached = cache.get(sourceUrl.href);
  if (cached) return cached;
  const loading = (async () => {
    const typescript = (await import("typescript")).default;
    const source = await readFile(sourceUrl, "utf8");
    let output = typescript.transpileModule(source, {
      compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
    }).outputText;
    const specifiers = [...output.matchAll(/from\s+["'](\.[^"']+)["']/gu)].map((match) => match[1]);
    for (const specifier of new Set(specifiers)) {
      const dependency = new URL(specifier.endsWith(".ts") ? specifier : `${specifier}.ts`, sourceUrl);
      const dependencyUrl = await typescriptModuleUrl(dependency, cache);
      output = output.replaceAll(`"${specifier}"`, `"${dependencyUrl}"`).replaceAll(`'${specifier}'`, `'${dependencyUrl}'`);
    }
    return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  })();
  cache.set(sourceUrl.href, loading);
  return loading;
}

async function loadAdminRepository() {
  const moduleUrl = await typescriptModuleUrl(new URL("../db/repositories/d1-admin-repository.ts", import.meta.url));
  return import(moduleUrl);
}

function adminContext(database) {
  return {
    database: new SQLiteD1Database(database),
    identity: { actorId: "repository-test", displayName: "Repository Test", localPreview: true },
    requestId: crypto.randomUUID(), environment: "local", hmacKey: null,
  };
}

function articleInput(overrides = {}) {
  return {
    title: "Artigo de teste para vídeo ainda não publicado",
    subtitle: "Subtítulo completo para validar o fluxo editorial com origem pendente.",
    slug: "video-pendente-repositorio",
    seoDescription: "Descrição completa usada para validar a publicação de um artigo com vídeo pendente.",
    categorySlug: "negociacoes",
    body: { schemaVersion: 1, blocks: [{ id: "paragraph-1", type: "paragraph", text: "Conteúdo editorial suficiente para testar o repositório real." }] },
    opinion: "Opinião editorial suficientemente completa para o teste.",
    imageUrl: "/images/articles/hero-negociacoes.png",
    imageAlt: "Carro usado no teste do vídeo pendente",
    youtubeVideoId: "pending12345",
    readTimeMinutes: 4,
    faq: [{ question: "O vídeo precisa estar público?", answer: "Não para criar, revisar ou publicar o artigo." }],
    ...overrides,
  };
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
  assert.equal(byName.get("video_availability").notnull, 1);
  const productColumns = database.prepare("PRAGMA table_info(products)").all();
  assert.ok(productColumns.some((column) => column.name === "primary_image_alt" && column.notnull === 1));
});

test("tracks pending YouTube availability without weakening source uniqueness", () => {
  const database = foundationDatabase();
  database.exec("INSERT INTO youtube_videos (id, provider, external_id, channel_handle, source_title, poster_url, import_state, detected_at) VALUES ('pending-video', 'youtube', 'pending12345', '@negociobaum', 'Vídeo aguardando publicação', '/images/pending.png', 'detected', 1)");
  assert.equal(database.prepare("SELECT import_state FROM youtube_videos WHERE id = 'pending-video'").get().import_state, "detected");
  assert.throws(() => database.exec("INSERT INTO youtube_videos (id, provider, external_id, channel_handle, source_title, poster_url, import_state, detected_at) VALUES ('pending-duplicate', 'youtube', 'pending12345', '@negociobaum', 'Duplicado', '/images/pending.png', 'detected', 1)"));
  assert.throws(() => database.exec("INSERT INTO published_article_projections (article_id, revision_id, slug, category_name, category_slug, title, subtitle, seo_description, search_text, image_url, image_alt, youtube_video_external_id, video_availability, date_label, body_json, opinion, faq_json, read_time_minutes, updated_at) VALUES ('missing', 'missing', 'missing', 'Dicas', 'dicas', 'Título', 'Subtítulo', 'SEO', 'busca', '/image.png', 'Imagem', 'pending12345', 'unknown', 'PUBLICADO', '[]', 'Opinião', '[]', 1, 1)"));
});

test("upgrades 0001-0005 projections with ready and pending YouTube availability", () => {
  const readyDatabase = prePendingVideoDatabase();
  insertLegacyProjection(readyDatabase);
  readyDatabase.exec(pendingYouTubeMigrationSql);
  assert.equal(readyDatabase.prepare("SELECT video_availability FROM published_article_projections").get().video_availability, "ready");

  const pendingDatabase = prePendingVideoDatabase();
  pendingDatabase.exec("UPDATE youtube_videos SET import_state = 'detected' WHERE id = 'vid_youtube_jT0j_rCgbbc'");
  insertLegacyProjection(pendingDatabase);
  pendingDatabase.exec(pendingYouTubeMigrationSql);
  assert.equal(pendingDatabase.prepare("SELECT video_availability FROM published_article_projections").get().video_availability, "pending");
  assert.throws(() => pendingDatabase.exec("UPDATE published_article_projections SET video_availability = 'unknown'"));
});

test("resolves unknown and imported YouTube sources through the real repository", async () => {
  const { createArticleDraft } = await loadAdminRepository();
  const database = foundationDatabase();
  const context = adminContext(database);
  const pending = await createArticleDraft(context, articleInput());
  assert.equal(pending.videoAvailability, "pending");
  assert.deepEqual(
    { ...database.prepare("SELECT import_state, COUNT(*) OVER () AS total FROM youtube_videos WHERE external_id = 'pending12345'").get() },
    { import_state: "detected", total: 1 },
  );

  const repeated = await createArticleDraft(context, articleInput({ articleId: pending.id }));
  assert.equal(repeated.videoAvailability, "pending");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM youtube_videos WHERE external_id = 'pending12345'").get().count, 1);

  const ready = await createArticleDraft(context, articleInput({
    slug: "video-importado-repositorio",
    youtubeVideoId: "E1mywkvsMEk",
  }));
  assert.equal(ready.videoAvailability, "ready");
  assert.equal(database.prepare("SELECT import_state FROM youtube_videos WHERE external_id = 'E1mywkvsMEk'").get().import_state, "imported");
});

test("rejects a pending YouTube source already linked to another article", async () => {
  const { createArticleDraft } = await loadAdminRepository();
  const database = foundationDatabase();
  const context = adminContext(database);
  await createArticleDraft(context, articleInput());
  await assert.rejects(
    createArticleDraft(context, articleInput({ slug: "outro-artigo-mesmo-video" })),
    (error) => error?.status === 409 && /outro artigo/i.test(error.message),
  );
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM articles a JOIN youtube_videos y ON y.id = a.source_video_id WHERE y.external_id = 'pending12345'").get().count, 1);
});

test("publishes a pending YouTube source into the public projection", async () => {
  const { createArticleDraft, publishArticle, submitArticleForReview } = await loadAdminRepository();
  const database = foundationDatabase();
  const context = adminContext(database);
  const draft = await createArticleDraft(context, articleInput());
  await submitArticleForReview(context, draft.id);
  await publishArticle(context, draft.id);
  const projection = database.prepare("SELECT youtube_video_external_id, video_availability FROM published_article_projections WHERE article_id = ?").get(draft.id);
  assert.deepEqual({ ...projection }, { youtube_video_external_id: "pending12345", video_availability: "pending" });
  assert.equal(database.prepare("SELECT workflow_state FROM article_revisions WHERE id = ?").get(draft.revisionId).workflow_state, "published");
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
