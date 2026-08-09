import { parseArticleContent } from "./article-content.ts";
import type { ArticleBlock, ArticleContentDocument } from "./article-content.ts";

type TiptapTextNode = Readonly<{ type: "text"; text: string }>;
type TiptapTextContent = readonly TiptapTextNode[];

export type TiptapArticleDocument = Readonly<{
  type: "doc";
  content: readonly TiptapArticleNode[];
}>;

export type TiptapArticleNode = Readonly<{
  type: "paragraph" | "heading" | "image";
  attrs: Readonly<Record<string, unknown>>;
  content?: TiptapTextContent;
}>;

const ROOT_KEYS = new Set(["type", "content"]);
const TEXT_KEYS = new Set(["type", "text"]);
const NODE_KEYS = new Set(["type", "attrs", "content"]);
const TEXT_ATTR_KEYS = new Set(["id"]);
const HEADING_ATTR_KEYS = new Set(["id", "level"]);
const IMAGE_ATTR_KEYS = new Set(["id", "assetId", "alt", "caption", "alignment", "width", "height"]);
const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function invalidDocument(): never {
  throw new Error("Documento Tiptap editorial inválido.");
}

function textContent(value: unknown): string {
  if (value === undefined) return "";
  if (!Array.isArray(value) || value.length !== 1) invalidDocument();
  const node: unknown = value[0];
  if (!isRecord(node) || !hasOnlyKeys(node, TEXT_KEYS) || node.type !== "text" || typeof node.text !== "string") {
    invalidDocument();
  }
  return node.text;
}

function requiredString(attrs: Record<string, unknown>, key: string): string {
  const value = attrs[key];
  if (typeof value !== "string" || value.length === 0) invalidDocument();
  return value;
}

function optionalString(attrs: Record<string, unknown>, key: string): string | undefined {
  const value = attrs[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") invalidDocument();
  return value;
}

function optionalDimension(attrs: Record<string, unknown>, key: string): number | undefined {
  const value = attrs[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number") invalidDocument();
  return value;
}

function textBlock(node: Record<string, unknown>, attrs: Record<string, unknown>): ArticleBlock {
  if (!hasOnlyKeys(attrs, TEXT_ATTR_KEYS)) invalidDocument();
  return { id: requiredString(attrs, "id"), type: "paragraph", text: textContent(node.content) };
}

function headingBlock(node: Record<string, unknown>, attrs: Record<string, unknown>): ArticleBlock {
  if (!hasOnlyKeys(attrs, HEADING_ATTR_KEYS) || (attrs.level !== 2 && attrs.level !== 3)) invalidDocument();
  return { id: requiredString(attrs, "id"), type: "heading", level: attrs.level, text: textContent(node.content) };
}

function imageBlock(node: Record<string, unknown>, attrs: Record<string, unknown>): ArticleBlock {
  if (!hasOnlyKeys(attrs, IMAGE_ATTR_KEYS) || node.content !== undefined) invalidDocument();
  const assetId = requiredString(attrs, "assetId");
  if (!ASSET_ID_PATTERN.test(assetId)) invalidDocument();
  const caption = optionalString(attrs, "caption");
  const width = optionalDimension(attrs, "width");
  const height = optionalDimension(attrs, "height");
  const alignment = attrs.alignment;
  if (alignment !== "inline" && alignment !== "wide") invalidDocument();
  const block: ArticleBlock = {
    id: requiredString(attrs, "id"),
    type: "image",
    assetId,
    alt: requiredString(attrs, "alt"),
    ...(caption === undefined ? {} : { caption }),
    alignment,
    ...(width === undefined ? {} : { width, height }),
  };
  return parseArticleContent({ schemaVersion: 1, blocks: [block] }).blocks[0];
}

function parseNode(value: unknown): ArticleBlock {
  if (!isRecord(value) || !hasOnlyKeys(value, NODE_KEYS) || !isRecord(value.attrs)) invalidDocument();
  if (value.type === "paragraph") return textBlock(value, value.attrs);
  if (value.type === "heading") return headingBlock(value, value.attrs);
  if (value.type === "image") return imageBlock(value, value.attrs);
  return invalidDocument();
}

function isPersistableBlock(block: ArticleBlock): boolean {
  return block.type === "image" || block.text.trim().length > 0;
}

export function tiptapToArticleDocument(value: unknown): ArticleContentDocument {
  if (!isRecord(value) || !hasOnlyKeys(value, ROOT_KEYS) || value.type !== "doc" || !Array.isArray(value.content)) {
    invalidDocument();
  }
  const blocks = value.content.map(parseNode).filter(isPersistableBlock);
  return parseArticleContent({ schemaVersion: 1, blocks });
}

function textNode(text: string): TiptapTextContent | undefined {
  return text.length === 0 ? undefined : [{ type: "text", text }];
}

function blockToNode(block: ArticleBlock): TiptapArticleNode {
  if (block.type === "paragraph") return { type: "paragraph", attrs: { id: block.id }, content: textNode(block.text) };
  if (block.type === "heading") {
    return { type: "heading", attrs: { id: block.id, level: block.level }, content: textNode(block.text) };
  }
  return {
    type: "image",
    attrs: {
      id: block.id,
      assetId: block.assetId,
      alt: block.alt,
      ...(block.caption === undefined ? {} : { caption: block.caption }),
      alignment: block.alignment,
      ...(block.width === undefined ? {} : { width: block.width, height: block.height }),
    },
  };
}

export function articleDocumentToTiptap(document: ArticleContentDocument): TiptapArticleDocument {
  const validated = parseArticleContent(document);
  return { type: "doc", content: validated.blocks.map(blockToNode) };
}
