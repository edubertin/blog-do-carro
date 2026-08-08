import type {
  CatalogProduct,
  CatalogRepository,
  DataRepositories,
  PublishedContentRepository,
} from "../contracts";
import type { D1Database, D1Row } from "../d1";
import type { ProductState } from "../schema";
import type {
  PublicArticle,
  PublicCategory,
  PublicCategoryGroup,
  PublicFaq,
  PublicFeaturedVideo,
  PublicSearchDocument,
} from "../../domain/public-content";
import { parseArticleContent } from "../../domain/article-content";

const articleColumns = `
  article_id, revision_id, slug, category_name, category_slug, title, subtitle,
  seo_description, image_url, image_alt, youtube_video_external_id, date_label,
  video_availability, body_json, opinion, faq_json, read_time_minutes, published_at, updated_at
`;

const productColumns = `
  p.id, v.id AS variant_id, p.slug, v.sku, p.name, p.collection_name,
  p.description, p.primary_image_url, p.primary_image_alt, p.status, v.currency, v.price_cents,
  v.price_kind, v.max_per_cart, v.inventory_mode
`;

function stringValue(row: D1Row, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.length === 0) throw new Error(`Campo inválido na leitura D1: ${key}`);
  return value;
}

function nullableStringValue(row: D1Row, key: string): string | undefined {
  const value = row[key];
  if (value === null) return undefined;
  if (typeof value !== "string") throw new Error(`Campo inválido na leitura D1: ${key}`);
  return value;
}

function integerValue(row: D1Row, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(`Campo inválido na leitura D1: ${key}`);
  return value;
}

function nullableIntegerValue(row: D1Row, key: string): number | undefined {
  const value = row[key];
  if (value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(`Campo inválido na leitura D1: ${key}`);
  return value;
}

function parsedJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("JSON inválido na projeção D1.", { cause: error });
  }
}

function articleBody(value: string): PublicArticle["body"] {
  return parseArticleContent(parsedJson(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function faqArray(value: string): readonly PublicFaq[] {
  const parsed = parsedJson(value);
  if (!Array.isArray(parsed)) throw new Error("FAQ inválido na projeção D1.");
  return parsed.map((item) => {
    if (!isRecord(item) || typeof item.question !== "string" || typeof item.answer !== "string") {
      throw new Error("Entrada de FAQ inválida na projeção D1.");
    }
    return { question: item.question, answer: item.answer };
  });
}

function isoTimestamp(value: number): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) throw new Error("Timestamp inválido na projeção D1.");
  return timestamp.toISOString();
}

function optionalIsoTimestamp(value: number | undefined): string | undefined {
  return value === undefined ? undefined : isoTimestamp(value);
}

function videoAvailability(value: string): "pending" | "ready" {
  if (value === "pending" || value === "ready") return value;
  throw new Error("Disponibilidade de vídeo inválida na projeção D1.");
}

function publishedArticle(row: D1Row): PublicArticle {
  return {
    slug: stringValue(row, "slug"),
    category: stringValue(row, "category_name"),
    categorySlug: stringValue(row, "category_slug"),
    title: stringValue(row, "title"),
    subtitle: stringValue(row, "subtitle"),
    seoDescription: stringValue(row, "seo_description"),
    dateLabel: stringValue(row, "date_label"),
    publishedAt: optionalIsoTimestamp(nullableIntegerValue(row, "published_at")),
    updatedAt: isoTimestamp(integerValue(row, "updated_at")),
    readTime: `${integerValue(row, "read_time_minutes")} MIN`,
    image: stringValue(row, "image_url"),
    imageAlt: stringValue(row, "image_alt"),
    videoId: nullableStringValue(row, "youtube_video_external_id"),
    videoAvailability: videoAvailability(stringValue(row, "video_availability")),
    body: articleBody(stringValue(row, "body_json")),
    opinion: stringValue(row, "opinion"),
    faq: faqArray(stringValue(row, "faq_json")),
  };
}

function productState(value: string): ProductState {
  if (value === "draft" || value === "preview" || value === "active" || value === "archived") return value;
  throw new Error("Estado de produto inválido na leitura D1.");
}

function catalogProduct(row: D1Row): CatalogProduct {
  const currency = stringValue(row, "currency");
  const priceKind = stringValue(row, "price_kind");
  const inventoryMode = stringValue(row, "inventory_mode");
  if (currency !== "BRL") throw new Error("Moeda inválida na leitura D1.");
  if (priceKind !== "illustrative" && priceKind !== "sale") throw new Error("Tipo de preço inválido na leitura D1.");
  if (inventoryMode !== "untracked" && inventoryMode !== "tracked") throw new Error("Modo de estoque inválido na leitura D1.");
  return {
    id: stringValue(row, "id"),
    variantId: stringValue(row, "variant_id"),
    slug: stringValue(row, "slug"),
    sku: stringValue(row, "sku"),
    name: stringValue(row, "name"),
    collectionName: stringValue(row, "collection_name"),
    description: stringValue(row, "description"),
    imageUrl: stringValue(row, "primary_image_url"),
    imageAlt: stringValue(row, "primary_image_alt"),
    status: productState(stringValue(row, "status")),
    currency,
    priceCents: integerValue(row, "price_cents"),
    priceKind,
    maxPerCart: integerValue(row, "max_per_cart"),
    inventoryMode,
  };
}

function normalizedLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) return 1;
  return Math.min(limit, 100);
}

async function articleRows(database: D1Database, query: string, values: readonly (string | number)[]): Promise<readonly PublicArticle[]> {
  const statement = database.prepare(query).bind(...values);
  const result = await statement.all();
  return result.results.map(publishedArticle);
}

function category(row: D1Row): PublicCategory {
  return { name: stringValue(row, "category_name"), slug: stringValue(row, "category_slug") };
}

type MutableCategoryGroup = {
  index: string;
  title: string;
  description: string;
  items: PublicCategory[];
};

function groupedCategories(rows: readonly D1Row[]): readonly PublicCategoryGroup[] {
  const groups = new Map<string, MutableCategoryGroup>();
  for (const row of rows) {
    const groupId = stringValue(row, "group_id");
    const item = category(row);
    const current = groups.get(groupId);
    if (current) current.items.push(item);
    else groups.set(groupId, {
      index: String(integerValue(row, "group_position")).padStart(2, "0"),
      title: stringValue(row, "group_name"),
      description: stringValue(row, "group_description"),
      items: [item],
    });
  }
  return [...groups.values()];
}

function featuredVideo(row: D1Row): PublicFeaturedVideo {
  return {
    id: stringValue(row, "video_id"),
    sourceTitle: stringValue(row, "source_title"),
    editorialTitle: stringValue(row, "editorial_title"),
    question: stringValue(row, "question"),
    views: stringValue(row, "meta_label"),
    image: stringValue(row, "poster_url"),
    articleSlug: stringValue(row, "article_slug"),
  };
}

function searchDocument(row: D1Row): PublicSearchDocument {
  return {
    slug: stringValue(row, "slug"),
    category: stringValue(row, "category_name"),
    title: stringValue(row, "title"),
    subtitle: stringValue(row, "subtitle"),
  };
}

function normalizedSearchText(value: string): string {
  return value.normalize("NFD").replaceAll(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

async function relatedArticles(database: D1Database, article: PublicArticle, limit: number): Promise<readonly PublicArticle[]> {
  const safeLimit = normalizedLimit(limit);
  const curatedQuery = "SELECT related.* FROM published_article_projections source JOIN article_relations relation ON relation.article_id = source.article_id JOIN published_article_projections related ON related.article_id = relation.related_article_id WHERE source.slug = ? ORDER BY relation.position LIMIT ?";
  const curated = await articleRows(database, curatedQuery, [article.slug, safeLimit]);
  if (curated.length === safeLimit) return curated;
  const fallbackQuery = `SELECT ${articleColumns} FROM published_article_projections WHERE slug <> ? ORDER BY CASE WHEN category_slug = ? THEN 0 ELSE 1 END, published_at DESC LIMIT 100`;
  const fallback = await articleRows(database, fallbackQuery, [article.slug, article.categorySlug]);
  const curatedSlugs = new Set(curated.map((item) => item.slug));
  return [...curated, ...fallback.filter((item) => !curatedSlugs.has(item.slug))].slice(0, safeLimit);
}

async function latestArticles(database: D1Database, limit: number): Promise<readonly PublicArticle[]> {
  const query = `SELECT ${articleColumns} FROM published_article_projections ORDER BY published_at DESC LIMIT ?`;
  return articleRows(database, query, [normalizedLimit(limit)]);
}

async function popularArticles(database: D1Database, limit: number): Promise<readonly PublicArticle[]> {
  const safeLimit = normalizedLimit(limit);
  const query = "SELECT p.* FROM home_items hi JOIN home_sections hs ON hs.id = hi.section_id JOIN published_article_projections p ON p.article_id = hi.article_id WHERE hs.section_type = 'popular' AND hs.status = 'published' AND hi.item_type = 'article' ORDER BY hi.position LIMIT ?";
  const curated = await articleRows(database, query, [safeLimit]);
  return curated.length ? curated : latestArticles(database, safeLimit);
}

async function articlesByCategory(database: D1Database, slug: string, limit: number): Promise<readonly PublicArticle[]> {
  const query = `SELECT ${articleColumns} FROM published_article_projections WHERE category_slug = ? ORDER BY published_at DESC LIMIT ?`;
  return articleRows(database, query, [slug, normalizedLimit(limit)]);
}

async function findArticle(database: D1Database, slug: string): Promise<PublicArticle | null> {
  const query = `SELECT ${articleColumns} FROM published_article_projections WHERE slug = ? LIMIT 1`;
  const row = await database.prepare(query).bind(slug).first();
  return row ? publishedArticle(row) : null;
}

async function activeCategories(database: D1Database): Promise<readonly PublicCategory[]> {
  const query = "SELECT c.name AS category_name, c.slug AS category_slug FROM categories c JOIN category_groups g ON g.id = c.group_id WHERE g.active = 1 AND c.active = 1 ORDER BY g.position, c.position";
  const result = await database.prepare(query).all();
  return result.results.map(category);
}

async function activeCategoryGroups(database: D1Database): Promise<readonly PublicCategoryGroup[]> {
  const query = "SELECT g.id AS group_id, g.name AS group_name, g.description AS group_description, g.position AS group_position, c.name AS category_name, c.slug AS category_slug FROM category_groups g JOIN categories c ON c.group_id = g.id WHERE g.active = 1 AND c.active = 1 ORDER BY g.position, c.position";
  const result = await database.prepare(query).all();
  return groupedCategories(result.results);
}

async function curatedVideos(database: D1Database): Promise<readonly PublicFeaturedVideo[]> {
  const query = "SELECT y.external_id AS video_id, y.source_title, hi.kicker AS editorial_title, hi.question, hi.meta_label, y.poster_url, p.slug AS article_slug FROM home_items hi JOIN home_sections hs ON hs.id = hi.section_id JOIN youtube_videos y ON y.id = hi.video_id JOIN published_article_projections p ON p.article_id = hi.article_id WHERE hs.section_type = 'hero' AND hs.status = 'published' AND hi.item_type = 'video' AND y.import_state = 'imported' ORDER BY hi.position";
  const result = await database.prepare(query).all();
  return result.results.map(featuredVideo);
}

async function navigationItems(database: D1Database) {
  const query = "SELECT mi.label, mi.href FROM menus m JOIN menu_items mi ON mi.menu_id = m.id WHERE m.status = 'published' AND mi.active = 1 ORDER BY mi.position";
  const result = await database.prepare(query).all();
  return result.results.map((row) => ({ label: stringValue(row, "label"), href: stringValue(row, "href") }));
}

async function searchArticles(database: D1Database, searchQuery: string, limit: number): Promise<readonly PublicSearchDocument[]> {
  const query = "SELECT slug, category_name, title, subtitle FROM published_article_projections WHERE search_text LIKE ? ORDER BY published_at DESC LIMIT ?";
  const searchValue = `%${normalizedSearchText(searchQuery.trim())}%`;
  const result = await database.prepare(query).bind(searchValue, normalizedLimit(limit)).all();
  return result.results.map(searchDocument);
}

function publishedRepository(database: D1Database): PublishedContentRepository {
  return {
    listPublishedArticles: (limit) => latestArticles(database, limit),
    listPopularArticles: (limit) => popularArticles(database, limit),
    listPublishedArticlesByCategory: (slug, limit) => articlesByCategory(database, slug, limit),
    listRelatedArticles: (article, limit) => relatedArticles(database, article, limit),
    findPublishedArticleBySlug: (slug) => findArticle(database, slug),
    listCategories: () => activeCategories(database),
    listCategoryGroups: () => activeCategoryGroups(database),
    listFeaturedVideos: () => curatedVideos(database),
    listNavigationItems: () => navigationItems(database),
    searchPublishedArticles: (query, limit) => searchArticles(database, query, limit),
  };
}

function catalogReadRepository(database: D1Database): CatalogRepository {
  return {
    async listCatalogProducts() {
      const query = `SELECT ${productColumns} FROM products p JOIN product_variants v ON v.product_id = p.id WHERE p.status IN ('preview', 'active') AND v.status IN ('preview', 'active') ORDER BY p.updated_at DESC`;
      const result = await database.prepare(query).all();
      return result.results.map(catalogProduct);
    },
    async findCatalogProductBySlug(slug) {
      const query = `SELECT ${productColumns} FROM products p JOIN product_variants v ON v.product_id = p.id WHERE p.slug = ? AND p.status IN ('preview', 'active') AND v.status IN ('preview', 'active') LIMIT 1`;
      const row = await database.prepare(query).bind(slug).first();
      return row ? catalogProduct(row) : null;
    },
  };
}

export function createD1Repositories(database: D1Database): DataRepositories {
  return {
    publishedContent: publishedRepository(database),
    catalog: catalogReadRepository(database),
  };
}
