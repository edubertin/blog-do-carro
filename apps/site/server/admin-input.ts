import type { ArticleDraftInput, HomeSectionInput, MenuItemInput, ProductDraftInput } from "../db/admin-contracts";

type JsonRecord = Record<string, unknown>;

function recordValue(value: unknown): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Corpo JSON invÃ¡lido.");
  return value as JsonRecord;
}

function textField(record: JsonRecord, key: string, max: number): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`Campo obrigatÃ³rio invÃ¡lido: ${key}.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new Error(`Campo fora do limite: ${key}.`);
  return normalized;
}

function integerField(record: JsonRecord, key: string, min: number, max: number): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`NÃºmero invÃ¡lido: ${key}.`);
  }
  return value;
}

function slugField(record: JsonRecord, key: string): string {
  const value = textField(record, key, 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) throw new Error(`Slug invÃ¡lido: ${key}.`);
  return value;
}

function urlOrPathField(record: JsonRecord, key: string): string {
  const value = textField(record, key, 500);
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") throw new Error(`URL insegura: ${key}.`);
  return parsed.toString();
}

function textArray(record: JsonRecord, key: string, maxItems: number): readonly string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) throw new Error(`Lista invÃ¡lida: ${key}.`);
  return value.map((item) => {
    if (typeof item !== "string" || !item.trim() || item.length > 5_000) throw new Error(`Item invÃ¡lido: ${key}.`);
    return item.trim();
  });
}

function faqItems(record: JsonRecord): ArticleDraftInput["faq"] {
  const value = record.faq;
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw new Error("FAQ invÃ¡lido.");
  return value.map((item) => {
    const faq = recordValue(item);
    return { question: textField(faq, "question", 300), answer: textField(faq, "answer", 2_000) };
  });
}

export function parseArticleDraftInput(value: unknown): ArticleDraftInput {
  const record = recordValue(value);
  const youtube = record.youtubeVideoId;
  if (youtube !== undefined && (typeof youtube !== "string" || !/^[\w-]{6,20}$/u.test(youtube))) {
    throw new Error("ID do YouTube invÃ¡lido.");
  }
  return {
    title: textField(record, "title", 180), subtitle: textField(record, "subtitle", 360),
    slug: slugField(record, "slug"), seoDescription: textField(record, "seoDescription", 180),
    categorySlug: slugField(record, "categorySlug"), body: textArray(record, "body", 40),
    opinion: textField(record, "opinion", 4_000), imageUrl: urlOrPathField(record, "imageUrl"),
    imageAlt: textField(record, "imageAlt", 240), youtubeVideoId: youtube,
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
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new Error("Menu invÃ¡lido.");
  return value.map((item) => {
    const record = recordValue(item);
    const active = record.active;
    if (typeof active !== "boolean") throw new Error("Estado de menu invÃ¡lido.");
    return { label: textField(record, "label", 80), href: urlOrPathField(record, "href"), active };
  });
}

export function parseHomeSections(value: unknown): readonly HomeSectionInput[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw new Error("ComposiÃ§Ã£o invÃ¡lida.");
  return value.map((item, position) => ({ id: textField(recordValue(item), "id", 80), position }));
}
