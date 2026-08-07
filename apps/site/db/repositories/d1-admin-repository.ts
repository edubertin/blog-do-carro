import type {
  AdminArticleSummary,
  AdminHomeSection,
  AdminMenuItem,
  AdminProductSummary,
  ArticleDraftInput,
  HomeSectionInput,
  MediaAssetRecord,
  MenuItemInput,
  ProductDraftInput,
} from "../admin-contracts";
import type { D1Database, D1PreparedStatement, D1Row } from "../d1";
import type { AdminIdentity, AdminPermission } from "../../app/admin/admin-auth-core";

export type AdminWriteContext = Readonly<{
  database: D1Database;
  identity: AdminIdentity;
  requestId: string;
  environment: "local" | "preview" | "production";
  hmacKey: string | null;
}>;

function text(row: D1Row, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`Campo D1 invÃ¡lido: ${key}.`);
  return value;
}

function integer(row: D1Row, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(`Campo D1 invÃ¡lido: ${key}.`);
  return value;
}

function articleSummary(row: D1Row): AdminArticleSummary {
  return {
    id: text(row, "id"), revisionId: text(row, "revision_id"), slug: text(row, "slug"),
    title: text(row, "title"), category: text(row, "category"),
    state: text(row, "workflow_state") as AdminArticleSummary["state"],
    version: integer(row, "version"), updatedAt: integer(row, "updated_at"),
  };
}

function productSummary(row: D1Row): AdminProductSummary {
  return {
    id: text(row, "id"), slug: text(row, "slug"), name: text(row, "name"), sku: text(row, "sku"),
    priceCents: integer(row, "price_cents"), state: text(row, "status") as AdminProductSummary["state"],
    version: integer(row, "version"),
  };
}

async function subjectFingerprint(identity: AdminIdentity, hmacKey: string | null): Promise<string> {
  if (identity.localPreview) return "local-preview";
  if (!hmacKey || new TextEncoder().encode(hmacKey).byteLength < 32) throw new Error("HMAC administrativo indisponÃ­vel.");
  const algorithm = { name: "HMAC", hash: "SHA-256" } as const;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(hmacKey), algorithm, false, ["sign"]);
  const signature = await crypto.subtle.sign(algorithm, key, new TextEncoder().encode(identity.actorId));
  return [...new Uint8Array(signature)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

async function ensurePrincipal(context: AdminWriteContext): Promise<string> {
  const fingerprint = await subjectFingerprint(context.identity, context.hmacKey);
  const existing = await context.database.prepare("SELECT id FROM admin_principals WHERE subject_hmac = ? AND status = 'active' LIMIT 1").bind(fingerprint).first();
  if (existing) return text(existing, "id");
  const id = `adm_${fingerprint.slice(0, 24)}`;
  const now = Date.now();
  await context.database.batch([
    context.database.prepare("INSERT INTO admin_principals (id, subject_hmac, display_label, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)").bind(id, fingerprint, "Administrador do portal", now, now),
    context.database.prepare("INSERT INTO admin_role_assignments (id, principal_id, role, assigned_by_principal_id, assigned_at) VALUES (?, ?, 'owner', NULL, ?)").bind(`role_${id}`, id, now),
  ]);
  return id;
}

function auditStatement(
  context: AdminWriteContext,
  principalId: string,
  permission: AdminPermission,
  action: string,
  resourceType: string,
  resourceId: string,
): D1PreparedStatement {
  return context.database.prepare("INSERT INTO audit_events (id, occurred_at, request_id, actor_kind, actor_principal_id, permission, action, resource_type, resource_id, environment, result) VALUES (?, ?, ?, 'admin', ?, ?, ?, ?, ?, ?, 'allowed')")
    .bind(crypto.randomUUID(), Date.now(), context.requestId, principalId, permission, action, resourceType, resourceId, context.environment);
}

async function categoryId(database: D1Database, slug: string): Promise<string> {
  const row = await database.prepare("SELECT id FROM categories WHERE slug = ? AND active = 1 LIMIT 1").bind(slug).first();
  if (!row) throw new Error("Categoria editorial nÃ£o encontrada.");
  return text(row, "id");
}

async function videoId(database: D1Database, externalId: string | undefined): Promise<string | null> {
  if (!externalId) return null;
  const row = await database.prepare("SELECT id FROM youtube_videos WHERE external_id = ? LIMIT 1").bind(externalId).first();
  if (!row) throw new Error("VÃ­deo do YouTube nÃ£o encontrado.");
  return text(row, "id");
}

function articleStatements(
  context: AdminWriteContext,
  input: ArticleDraftInput,
  ids: Readonly<{ article: string; revision: string; category: string; video: string | null; principal: string }>,
): readonly D1PreparedStatement[] {
  const now = Date.now();
  const database = context.database;
  const statements: D1PreparedStatement[] = [
    database.prepare("INSERT INTO articles (id, slug, lifecycle_state, source_video_id, working_revision_id, published_revision_id, version, created_at, updated_at) VALUES (?, ?, 'draft', ?, NULL, NULL, 1, ?, ?)").bind(ids.article, input.slug, ids.video, now, now),
    database.prepare("INSERT INTO article_revisions (id, article_id, revision_number, workflow_state, title, subtitle, seo_description, body_json, opinion, image_url, image_alt, read_time_minutes, created_by_principal_id, created_at, version, updated_at) VALUES (?, ?, 1, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)").bind(ids.revision, ids.article, input.title, input.subtitle, input.seoDescription, JSON.stringify(input.body), input.opinion, input.imageUrl, input.imageAlt, input.readTimeMinutes, ids.principal, now, now),
    database.prepare("UPDATE articles SET working_revision_id = ? WHERE id = ?").bind(ids.revision, ids.article),
    database.prepare("INSERT INTO article_revision_categories (revision_id, category_id, is_primary) VALUES (?, ?, 1)").bind(ids.revision, ids.category),
  ];
  input.faq.forEach((faq, position) => statements.push(database.prepare("INSERT INTO article_revision_faqs (id, revision_id, position, question, answer) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ids.revision, position, faq.question, faq.answer)));
  statements.push(auditStatement(context, ids.principal, "content.write", "article.draft.created", "article", ids.article));
  return statements;
}

async function existingArticle(database: D1Database, slug: string): Promise<D1Row | null> {
  const query = "SELECT a.id, a.version, COALESCE(MAX(r.revision_number), 0) AS revision_number FROM articles a LEFT JOIN article_revisions r ON r.article_id = a.id WHERE a.slug = ? GROUP BY a.id, a.version LIMIT 1";
  return database.prepare(query).bind(slug).first();
}

function revisedArticleStatements(
  context: AdminWriteContext,
  input: ArticleDraftInput,
  ids: Readonly<{ article: string; revision: string; category: string; video: string | null; principal: string }>,
  revisionNumber: number,
): readonly D1PreparedStatement[] {
  const now = Date.now();
  const database = context.database;
  const statements: D1PreparedStatement[] = [
    database.prepare("INSERT INTO article_revisions (id, article_id, revision_number, workflow_state, title, subtitle, seo_description, body_json, opinion, image_url, image_alt, read_time_minutes, created_by_principal_id, created_at, version, updated_at) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)").bind(ids.revision, ids.article, revisionNumber, input.title, input.subtitle, input.seoDescription, JSON.stringify(input.body), input.opinion, input.imageUrl, input.imageAlt, input.readTimeMinutes, ids.principal, now, now),
    database.prepare("UPDATE articles SET working_revision_id = ?, source_video_id = ?, version = version + 1, updated_at = ? WHERE id = ?").bind(ids.revision, ids.video, now, ids.article),
    database.prepare("INSERT INTO article_revision_categories (revision_id, category_id, is_primary) VALUES (?, ?, 1)").bind(ids.revision, ids.category),
  ];
  input.faq.forEach((faq, position) => statements.push(database.prepare("INSERT INTO article_revision_faqs (id, revision_id, position, question, answer) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ids.revision, position, faq.question, faq.answer)));
  statements.push(auditStatement(context, ids.principal, "content.write", "article.draft.revised", "article", ids.article));
  return statements;
}

export async function createArticleDraft(context: AdminWriteContext, input: ArticleDraftInput): Promise<AdminArticleSummary> {
  const principal = await ensurePrincipal(context);
  const category = await categoryId(context.database, input.categorySlug);
  const video = await videoId(context.database, input.youtubeVideoId);
  const existing = await existingArticle(context.database, input.slug);
  const ids = { article: existing ? text(existing, "id") : crypto.randomUUID(), revision: crypto.randomUUID(), category, video, principal };
  const version = existing ? integer(existing, "version") + 1 : 1;
  if (existing) {
    await context.database.batch(revisedArticleStatements(context, input, ids, integer(existing, "revision_number") + 1));
  } else {
    await context.database.batch(articleStatements(context, input, ids));
  }
  return {
    id: ids.article, revisionId: ids.revision, slug: input.slug, title: input.title,
    category: input.categorySlug, state: "draft", version, updatedAt: Date.now(),
  };
}

export async function listAdminArticles(database: D1Database): Promise<readonly AdminArticleSummary[]> {
  const query = "SELECT a.id, a.slug, a.version, a.updated_at, r.id AS revision_id, r.title, r.workflow_state, c.name AS category FROM articles a JOIN article_revisions r ON r.id = a.working_revision_id JOIN article_revision_categories arc ON arc.revision_id = r.id AND arc.is_primary = 1 JOIN categories c ON c.id = arc.category_id ORDER BY a.updated_at DESC";
  const result = await database.prepare(query).all();
  return result.results.map(articleSummary);
}

function normalizedSearchText(value: string): string {
  return value.normalize("NFD").replaceAll(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

async function publicationSource(database: D1Database, articleId: string): Promise<D1Row> {
  const query = "SELECT a.id, a.slug, a.working_revision_id AS revision_id, r.title, r.subtitle, r.seo_description, r.body_json, r.opinion, r.image_url, r.image_alt, r.read_time_minutes, c.id AS category_id, c.name AS category_name, c.slug AS category_slug, y.external_id AS youtube_video_external_id FROM articles a JOIN article_revisions r ON r.id = a.working_revision_id JOIN article_revision_categories arc ON arc.revision_id = r.id AND arc.is_primary = 1 JOIN categories c ON c.id = arc.category_id LEFT JOIN youtube_videos y ON y.id = a.source_video_id WHERE a.id = ? AND a.lifecycle_state <> 'archived' LIMIT 1";
  const row = await database.prepare(query).bind(articleId).first();
  if (!row) throw new Error("Rascunho editorial nÃ£o encontrado.");
  return row;
}

async function publicationFaq(database: D1Database, revisionId: string): Promise<string> {
  const result = await database.prepare("SELECT question, answer FROM article_revision_faqs WHERE revision_id = ? ORDER BY position").bind(revisionId).all();
  const faq = result.results.map((row) => ({ question: text(row, "question"), answer: text(row, "answer") }));
  if (!faq.length) throw new Error("FAQ obrigatÃ³rio ausente.");
  return JSON.stringify(faq);
}

function projectionStatement(context: AdminWriteContext, source: D1Row, faqJson: string, now: number): D1PreparedStatement {
  const bodyJson = text(source, "body_json");
  const searchable = normalizedSearchText([text(source, "title"), text(source, "subtitle"), text(source, "category_name"), bodyJson].join(" "));
  const video = source.youtube_video_external_id === null ? null : text(source, "youtube_video_external_id");
  const sql = "INSERT INTO published_article_projections (article_id, revision_id, slug, category_name, category_slug, title, subtitle, seo_description, search_text, image_url, image_alt, youtube_video_external_id, date_label, body_json, opinion, faq_json, read_time_minutes, published_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLICADO', ?, ?, ?, ?, ?, ?) ON CONFLICT(article_id) DO UPDATE SET revision_id = excluded.revision_id, slug = excluded.slug, category_name = excluded.category_name, category_slug = excluded.category_slug, title = excluded.title, subtitle = excluded.subtitle, seo_description = excluded.seo_description, search_text = excluded.search_text, image_url = excluded.image_url, image_alt = excluded.image_alt, youtube_video_external_id = excluded.youtube_video_external_id, date_label = excluded.date_label, body_json = excluded.body_json, opinion = excluded.opinion, faq_json = excluded.faq_json, read_time_minutes = excluded.read_time_minutes, published_at = excluded.published_at, updated_at = excluded.updated_at";
  return context.database.prepare(sql).bind(text(source, "id"), text(source, "revision_id"), text(source, "slug"), text(source, "category_name"), text(source, "category_slug"), text(source, "title"), text(source, "subtitle"), text(source, "seo_description"), searchable, text(source, "image_url"), text(source, "image_alt"), video, bodyJson, text(source, "opinion"), faqJson, integer(source, "read_time_minutes"), now, now);
}

export async function publishArticle(context: AdminWriteContext, articleId: string): Promise<void> {
  const principal = await ensurePrincipal(context);
  const source = await publicationSource(context.database, articleId);
  if (text(source, "image_url").startsWith("/api/admin/")) throw new Error("MÃ­dia em estÃ¡gio privado nÃ£o pode ser publicada.");
  const revisionId = text(source, "revision_id");
  const faqJson = await publicationFaq(context.database, revisionId);
  const now = Date.now();
  await context.database.batch([
    context.database.prepare("UPDATE article_revisions SET workflow_state = 'published', published_at = ?, version = version + 1, updated_at = ? WHERE id = ?").bind(now, now, revisionId),
    context.database.prepare("UPDATE articles SET lifecycle_state = 'active', published_revision_id = ?, version = version + 1, updated_at = ? WHERE id = ?").bind(revisionId, now, articleId),
    projectionStatement(context, source, faqJson, now),
    context.database.prepare("DELETE FROM published_article_categories WHERE article_id = ?").bind(articleId),
    context.database.prepare("INSERT INTO published_article_categories (article_id, category_id, published_at) VALUES (?, ?, ?)").bind(articleId, text(source, "category_id"), now),
    auditStatement(context, principal, "content.publish", "article.published", "article", articleId),
  ]);
}

export async function createProductDraft(context: AdminWriteContext, input: ProductDraftInput): Promise<AdminProductSummary> {
  const principal = await ensurePrincipal(context);
  const productId = crypto.randomUUID();
  const variantId = crypto.randomUUID();
  const now = Date.now();
  await context.database.batch([
    context.database.prepare("INSERT INTO products (id, slug, name, collection_code, collection_name, description, primary_image_url, primary_image_alt, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?)").bind(productId, input.slug, input.name, input.slug, input.collectionName, input.description, input.imageUrl, input.imageAlt, now, now),
    context.database.prepare("INSERT INTO product_variants (id, product_id, sku, status, currency, price_cents, price_kind, max_per_cart, inventory_mode, version, created_at, updated_at) VALUES (?, ?, ?, 'draft', 'BRL', ?, 'illustrative', 5, 'untracked', 1, ?, ?)").bind(variantId, productId, input.sku, input.priceCents, now, now),
    auditStatement(context, principal, "catalog.write", "product.draft.created", "product", productId),
  ]);
  return { id: productId, slug: input.slug, name: input.name, sku: input.sku, priceCents: input.priceCents, state: "draft", version: 1 };
}

export async function listAdminProducts(database: D1Database): Promise<readonly AdminProductSummary[]> {
  const query = "SELECT p.id, p.slug, p.name, p.status, p.version, v.sku, v.price_cents FROM products p JOIN product_variants v ON v.product_id = p.id ORDER BY p.updated_at DESC";
  const result = await database.prepare(query).all();
  return result.results.map(productSummary);
}

export async function setProductArchived(context: AdminWriteContext, productId: string, archived: boolean): Promise<void> {
  const principal = await ensurePrincipal(context);
  const status = archived ? "archived" : "draft";
  const now = Date.now();
  await context.database.batch([
    context.database.prepare("UPDATE products SET status = ?, version = version + 1, updated_at = ? WHERE id = ?").bind(status, now, productId),
    context.database.prepare("UPDATE product_variants SET status = ?, version = version + 1, updated_at = ? WHERE product_id = ?").bind(status, now, productId),
    auditStatement(context, principal, "catalog.write", archived ? "product.archived" : "product.restored", "product", productId),
  ]);
}

export async function saveMenu(context: AdminWriteContext, items: readonly MenuItemInput[]): Promise<void> {
  const principal = await ensurePrincipal(context);
  const menuId = "main";
  const now = Date.now();
  const statements: D1PreparedStatement[] = [
    context.database.prepare("INSERT INTO menus (id, name, status, version, updated_at) VALUES (?, 'Menu principal', 'published', 1, ?) ON CONFLICT(id) DO UPDATE SET version = version + 1, updated_at = excluded.updated_at").bind(menuId, now),
    context.database.prepare("DELETE FROM menu_items WHERE menu_id = ?").bind(menuId),
  ];
  items.forEach((item, position) => statements.push(context.database.prepare("INSERT INTO menu_items (id, menu_id, label, href, position, active) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), menuId, item.label, item.href, position, item.active ? 1 : 0)));
  statements.push(auditStatement(context, principal, "home.write", "menu.saved", "menu", menuId));
  await context.database.batch(statements);
}

export async function listAdminMenu(database: D1Database): Promise<readonly AdminMenuItem[]> {
  const result = await database.prepare("SELECT label, href, active FROM menu_items WHERE menu_id = 'main' ORDER BY position").all();
  return result.results.map((row) => ({
    label: text(row, "label"), href: text(row, "href"), active: integer(row, "active") === 1,
  }));
}

export async function saveHomeOrder(context: AdminWriteContext, sections: readonly HomeSectionInput[]): Promise<void> {
  const principal = await ensurePrincipal(context);
  const now = Date.now();
  const statements: D1PreparedStatement[] = [
    context.database.prepare("UPDATE home_sections SET position = position + 100 WHERE status = 'published'"),
  ];
  sections.forEach((section) => statements.push(context.database.prepare("UPDATE home_sections SET position = ?, version = version + 1, updated_at = ? WHERE id = ? AND status = 'published'").bind(section.position, now, section.id)));
  statements.push(auditStatement(context, principal, "home.write", "home.order.saved", "home", "main"));
  await context.database.batch(statements);
}

export async function listAdminHomeSections(database: D1Database): Promise<readonly AdminHomeSection[]> {
  const result = await database.prepare("SELECT id, position FROM home_sections WHERE status = 'published' ORDER BY position").all();
  return result.results.map((row) => ({ id: text(row, "id"), position: integer(row, "position") }));
}

export async function saveMediaAsset(context: AdminWriteContext, asset: MediaAssetRecord): Promise<void> {
  const principal = await ensurePrincipal(context);
  const now = Date.now();
  await context.database.batch([
    context.database.prepare("INSERT INTO media_assets (id, object_key, content_type, byte_size, alt_text, lifecycle_state, created_by_principal_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'staged', ?, ?, ?)").bind(asset.id, asset.objectKey, asset.contentType, asset.byteSize, asset.altText, principal, now, now),
    auditStatement(context, principal, "content.write", "media.staged", "media", asset.id),
  ]);
}
