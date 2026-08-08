import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const migrations = ["0001_d1_foundation.sql", "0002_cms_media.sql", "0003_community_store_catalog.sql", "0004_structured_article_media.sql", "0005_storefront_refresh.sql", "0006_pending_youtube_videos.sql"];
const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const executionContext = { waitUntil() {}, passThroughOnException() {} };

class SQLiteStatement {
  constructor(database, query, values = []) { this.database = database; this.query = query; this.values = values; }
  bind(...values) { return new SQLiteStatement(this.database, this.query, values); }
  async first() { return this.database.prepare(this.query).get(...this.values) ?? null; }
  async all() { return { success: true, results: this.database.prepare(this.query).all(...this.values) }; }
  async run() { this.database.prepare(this.query).run(...this.values); return { success: true, results: [] }; }
}

class SQLiteDatabase {
  constructor(database) { this.database = database; }
  prepare(query) { return new SQLiteStatement(this.database, query); }
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

class MemoryR2 {
  objects = new Map();
  async put(key, body) { this.objects.set(key, new Uint8Array(body)); }
  async get(key) { const body = this.objects.get(key); return body ? { body } : null; }
  async delete(key) { this.objects.delete(key); }
}

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  for (const migration of migrations) database.exec(readFileSync(new URL(`../drizzle/${migration}`, import.meta.url), "utf8"));
  database.exec(readFileSync(new URL("../drizzle/0001_foundation_seed.sql", import.meta.url), "utf8"));
  return { raw: database, binding: new SQLiteDatabase(database) };
}

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("integration", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function request(worker, path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET") headers.set("Origin", "http://localhost");
  return worker.fetch(new Request(`http://localhost${path}`, { ...init, headers }), environment, executionContext);
}

async function uploadImage(worker, altText) {
  const bytes = readFileSync(new URL("../public/images/articles/hero-negociacoes.png", import.meta.url));
  const form = new FormData();
  form.set("altText", altText);
  form.set("file", new File([bytes], "homologacao.png", { type: "image/png" }));
  const response = await request(worker, "/api/admin/media", { method: "POST", body: form });
  const payload = await response.json();
  assert.equal(response.status, 201, JSON.stringify(payload));
  return payload.asset;
}

function articleInput(cover, inline) {
  return {
    title: "Discovery versus Cruze: fogo cruzado na negociação",
    subtitle: "Homologação editorial completa com imagens próprias e vídeo ainda agendado.",
    slug: "homologacao-discovery-cruze",
    seoDescription: "Teste integrado do fluxo editorial com upload, revisão, publicação e vídeo do YouTube ainda pendente.",
    categorySlug: "negociacoes",
    body: { schemaVersion: 1, blocks: [
      { id: "paragraph-1", type: "paragraph", text: "Este conteúdo valida o ciclo editorial completo usando D1 e armazenamento de mídia local integrado, incluindo a projeção pública, o histórico imutável e a restauração segura." },
      { id: "image-1", type: "image", assetId: inline.id, alt: "Imagem interna da homologação", caption: "Imagem inserida no corpo do artigo.", alignment: "inline", width: inline.width, height: inline.height },
    ] },
    opinion: "A publicação precisa ser atômica: sem o objeto no armazenamento, a projeção anterior deve permanecer intacta.",
    imageUrl: `/media/${cover.id}`,
    imageAlt: "Capa do comparativo Discovery versus Cruze",
    youtubeVideoId: "UA71DVIHxPk",
    readTimeMinutes: 4,
    faq: [{ question: "O vídeo agendado pode originar o artigo?", answer: "Sim. O artigo é publicado sem incorporar um player indisponível." }],
  };
}

test("homologa upload, privacidade staged e publicação D1+R2 sem interceptar rotas", async () => {
  const runtime = await import("./cloudflare-workers-stub.mjs");
  const { raw, binding } = createDatabase();
  const media = new MemoryR2();
  Object.assign(runtime.env, { DB: binding, MEDIA: media, CMS_PUBLIC_READ_ENABLED: "1", MEDIA_UPLOAD_ENABLED: "1" });
  const worker = await loadWorker();
  try {
    const cover = await uploadImage(worker, "Capa da homologação editorial");
    const inline = await uploadImage(worker, "Imagem interna da homologação editorial");
    assert.equal((await request(worker, `/media/${cover.id}`)).status, 404);

    const draftResponse = await request(worker, "/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(articleInput(cover, inline)) });
    const draftPayload = await draftResponse.json();
    assert.equal(draftResponse.status, 201, JSON.stringify(draftPayload));
    const draft = draftPayload.article;
    assert.equal(draft.videoAvailability, "pending");
    assert.equal((await request(worker, `/media/${inline.id}`)).status, 404);

    assert.equal((await request(worker, `/api/admin/articles/${draft.id}/review`, { method: "POST" })).status, 200);
    assert.equal((await request(worker, `/api/admin/articles/${draft.id}/publish`, { method: "POST" })).status, 200);
    const publicMedia = await request(worker, `/media/${cover.id}`);
    assert.equal(publicMedia.status, 200);
    assert.equal(publicMedia.headers.get("etag"), `"${cover.sha256}"`);
    const notModified = await request(worker, `/media/${cover.id}`, { headers: { "If-None-Match": `"${cover.sha256}"` } });
    assert.equal(notModified.status, 304);

    const article = await request(worker, "/artigos/homologacao-discovery-cruze");
    const articleHtml = await article.text();
    assert.equal(article.status, 200);
    assert.match(articleHtml, /Discovery versus Cruze/i);
    assert.doesNotMatch(articleHtml, /youtube-nocookie\.com\/embed/i);
    const homeHtml = await (await request(worker, "/")).text();
    assert.doesNotMatch(homeHtml, /UA71DVIHxPk/);
    assert.doesNotMatch(homeHtml, /youtube-nocookie\.com\/embed\/UA71DVIHxPk/i);
    assert.equal(raw.prepare("SELECT video_availability FROM published_article_projections WHERE article_id = ?").get(draft.id).video_availability, "pending");
  } finally {
    for (const key of ["DB", "MEDIA", "CMS_PUBLIC_READ_ENABLED", "MEDIA_UPLOAD_ENABLED"]) delete runtime.env[key];
    raw.close();
  }
});

test("objeto R2 ausente impede publicação e preserva a projeção anterior", async () => {
  const runtime = await import("./cloudflare-workers-stub.mjs");
  const { raw, binding } = createDatabase();
  const media = new MemoryR2();
  Object.assign(runtime.env, { DB: binding, MEDIA: media, CMS_PUBLIC_READ_ENABLED: "1", MEDIA_UPLOAD_ENABLED: "1" });
  const worker = await loadWorker();
  try {
    const cover = await uploadImage(worker, "Capa que será removida do armazenamento");
    const inline = await uploadImage(worker, "Imagem interna que permanece armazenada");
    const created = await request(worker, "/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(articleInput(cover, inline)) });
    const draft = (await created.json()).article;
    await request(worker, `/api/admin/articles/${draft.id}/review`, { method: "POST" });
    media.objects.delete(cover.objectKey);
    const response = await request(worker, `/api/admin/articles/${draft.id}/publish`, { method: "POST" });
    assert.equal(response.status, 500);
    assert.equal(raw.prepare("SELECT COUNT(*) AS count FROM published_article_projections WHERE article_id = ?").get(draft.id).count, 0);
    assert.equal(raw.prepare("SELECT workflow_state FROM article_revisions WHERE id = ?").get(draft.revisionId).workflow_state, "review");
    assert.equal(raw.prepare("SELECT lifecycle_state FROM media_assets WHERE id = ?").get(inline.id).lifecycle_state, "staged");
  } finally {
    for (const key of ["DB", "MEDIA", "CMS_PUBLIC_READ_ENABLED", "MEDIA_UPLOAD_ENABLED"]) delete runtime.env[key];
    raw.close();
  }
});

test("restaura uma revisão publicada com suas mídias sem sobrescrever o histórico", async () => {
  const runtime = await import("./cloudflare-workers-stub.mjs");
  const { raw, binding } = createDatabase();
  const media = new MemoryR2();
  Object.assign(runtime.env, { DB: binding, MEDIA: media, CMS_PUBLIC_READ_ENABLED: "1", MEDIA_UPLOAD_ENABLED: "1" });
  const worker = await loadWorker();
  try {
    const firstCover = await uploadImage(worker, "Primeira capa do histórico editorial");
    const firstInline = await uploadImage(worker, "Primeira imagem interna do histórico");
    const initialResponse = await request(worker, "/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(articleInput(firstCover, firstInline)) });
    const initial = (await initialResponse.json()).article;
    await request(worker, `/api/admin/articles/${initial.id}/review`, { method: "POST" });
    await request(worker, `/api/admin/articles/${initial.id}/publish`, { method: "POST" });

    const secondCover = await uploadImage(worker, "Segunda capa do histórico editorial");
    const secondInline = await uploadImage(worker, "Segunda imagem interna do histórico");
    const changedInput = articleInput(secondCover, secondInline);
    const changedResponse = await request(worker, "/api/admin/articles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...changedInput, articleId: initial.id, title: "Segunda versão editorial publicada" }),
    });
    assert.equal(changedResponse.status, 200);
    const changed = (await changedResponse.json()).article;
    await request(worker, `/api/admin/articles/${initial.id}/review`, { method: "POST" });
    await request(worker, `/api/admin/articles/${initial.id}/publish`, { method: "POST" });
    assert.equal(raw.prepare("SELECT title FROM published_article_projections WHERE article_id = ?").get(initial.id).title, "Segunda versão editorial publicada");

    const versionBeforeRestore = raw.prepare("SELECT version FROM articles WHERE id = ?").get(initial.id).version;
    const restoreResponse = await request(worker, `/api/admin/articles/${initial.id}/restore`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId: initial.revisionId, expectedVersion: versionBeforeRestore }),
    });
    const restored = await restoreResponse.json();
    assert.equal(restoreResponse.status, 200, JSON.stringify(restored));
    assert.equal(restored.article.title, articleInput(firstCover, firstInline).title);
    assert.notEqual(restored.article.revisionId, initial.revisionId);
    assert.notEqual(restored.article.revisionId, changed.revisionId);
    assert.equal(raw.prepare("SELECT title FROM published_article_projections WHERE article_id = ?").get(initial.id).title, articleInput(firstCover, firstInline).title);
    assert.equal(raw.prepare("SELECT COUNT(*) AS count FROM article_revisions WHERE article_id = ?").get(initial.id).count, 3);
    assert.equal(raw.prepare("SELECT COUNT(*) AS count FROM article_revision_media WHERE revision_id = ?").get(restored.article.revisionId).count, 2);
    assert.equal((await request(worker, `/media/${firstCover.id}`)).status, 200);
  } finally {
    for (const key of ["DB", "MEDIA", "CMS_PUBLIC_READ_ENABLED", "MEDIA_UPLOAD_ENABLED"]) delete runtime.env[key];
    raw.close();
  }
});
