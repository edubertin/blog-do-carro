import type { ArticleDraftInput, HomeSectionInput, MenuItemInput, ProductDraftInput } from "../db/admin-contracts";
import { articleText, parseArticleContent } from "../domain/article-content";
import { invalidInput } from "./admin-errors";

type JsonRecord = Record<string, unknown>;

function recordValue(value: unknown): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw invalidInput("Corpo JSON inválido.");
  return value as JsonRecord;
}

function textField(record: JsonRecord, key: string, max: number, min = 1): string {
  const value = record[key];
  if (typeof value !== "string") throw invalidInput(`Campo obrigatório inválido: ${key}.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) throw invalidInput(`Campo fora do limite: ${key}.`);
  return normalized;
}

function integerField(record: JsonRecord, key: string, min: number, max: number): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw invalidInput(`Número inválido: ${key}.`);
  }
  return value;
}

function slugField(record: JsonRecord, key: string): string {
  const value = textField(record, key, 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) throw invalidInput(`Endereço inválido: ${key}.`);
  return value;
}

function urlOrPathField(record: JsonRecord, key: string): string {
  const value = textField(record, key, 500);
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..") && !value.includes("?") && !value.includes("#")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) return parsed.toString();
  } catch (error) {
    console.info("URL administrativa rejeitada durante validação.", error);
  }
  throw invalidInput(`URL ou caminho inválido: ${key}.`);
}

function articleBody(record: JsonRecord): ArticleDraftInput["body"] {
  let body: ArticleDraftInput["body"];
  try {
    body = parseArticleContent(record.body);
  } catch (error) {
    console.info("Documento editorial rejeitado.", error);
    throw invalidInput("Conteúdo estruturado inválido.");
  }
  if (body.blocks.length < 1 || body.blocks.length > 120) throw invalidInput("Quantidade de blocos inválida.");
  const imageCount = body.blocks.filter((block) => block.type === "image").length;
  if (imageCount > 30) throw invalidInput("O artigo aceita até 30 imagens internas.");
  for (const block of body.blocks) validateBlock(block);
  return body;
}

function validateBlock(block: ArticleDraftInput["body"]["blocks"][number]): void {
  if (block.type === "image") {
    if (!/^[0-9a-f-]{20,40}$/iu.test(block.assetId)) throw invalidInput("Imagem interna inválida.");
    if (block.alt.trim().length < 5 || block.alt.length > 240) throw invalidInput("Descrição da imagem inválida.");
    if (block.caption && block.caption.length > 300) throw invalidInput("Legenda da imagem inválida.");
    return;
  }
  const max = block.type === "heading" ? 180 : 5_000;
  if (!block.text.trim() || block.text.length > max) throw invalidInput("Bloco de texto inválido.");
}

function faqItems(record: JsonRecord): ArticleDraftInput["faq"] {
  const value = record.faq;
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw invalidInput("FAQ inválido.");
  return value.map((item) => {
    const faq = recordValue(item);
    return { question: textField(faq, "question", 300, 10), answer: textField(faq, "answer", 2_000, 10) };
  });
}

export function parseArticleDraftInput(value: unknown): ArticleDraftInput {
  const record = recordValue(value);
  const body = articleBody(record);
  if (articleText(body).length < 100) throw invalidInput("O artigo precisa ter pelo menos 100 caracteres.");
  const youtube = record.youtubeVideoId;
  if (typeof youtube !== "string" || !/^[\w-]{6,20}$/u.test(youtube)) throw invalidInput("ID do YouTube inválido.");
  const rawArticleId = record.articleId;
  if (rawArticleId !== undefined && (typeof rawArticleId !== "string" || !rawArticleId.trim() || rawArticleId.length > 100)) throw invalidInput("Identificador do artigo inválido.");
  return {
    articleId: typeof rawArticleId === "string" ? rawArticleId.trim() : undefined,
    title: textField(record, "title", 180, 10), subtitle: textField(record, "subtitle", 360, 20),
    slug: slugField(record, "slug"), seoDescription: textField(record, "seoDescription", 180, 50),
    categorySlug: slugField(record, "categorySlug"), body,
    opinion: textField(record, "opinion", 4_000, 20), imageUrl: urlOrPathField(record, "imageUrl"),
    imageAlt: textField(record, "imageAlt", 240, 5), youtubeVideoId: youtube,
    readTimeMinutes: integerField(record, "readTimeMinutes", 1, 120), faq: faqItems(record),
  };
}

export function parseProductDraftInput(value: unknown): ProductDraftInput {
  const record = recordValue(value);
  return {
    name: textField(record, "name", 160), slug: slugField(record, "slug"), sku: textField(record, "sku", 80),
    collectionName: textField(record, "collectionName", 160), description: textField(record, "description", 2_000),
    imageUrl: urlOrPathField(record, "imageUrl"), imageAlt: textField(record, "imageAlt", 240),
    priceCents: integerField(record, "priceCents", 0, 100_000_000),
  };
}

export function parseMenuItems(value: unknown): readonly MenuItemInput[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw invalidInput("Menu inválido.");
  return value.map((item) => {
    const record = recordValue(item);
    const active = record.active;
    if (typeof active !== "boolean") throw invalidInput("Estado de menu inválido.");
    return { label: textField(record, "label", 80), href: urlOrPathField(record, "href"), active };
  });
}

export function parseHomeSections(value: unknown): readonly HomeSectionInput[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw invalidInput("Composição inválida.");
  return value.map((item, position) => ({ id: textField(recordValue(item), "id", 80), position }));
}
