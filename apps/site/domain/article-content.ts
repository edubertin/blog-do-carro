export type ParagraphBlock = Readonly<{ id: string; type: "paragraph"; text: string }>;
export type HeadingBlock = Readonly<{ id: string; type: "heading"; level: 2 | 3; text: string }>;
export type ImageBlock = Readonly<{
  id: string;
  type: "image";
  assetId: string;
  alt: string;
  caption?: string;
  alignment: "inline" | "wide";
}>;

export type ArticleBlock = ParagraphBlock | HeadingBlock | ImageBlock;
export type ArticleContentDocument = Readonly<{ schemaVersion: 1; blocks: readonly ArticleBlock[] }>;

function blockId(index: number): string {
  return `legacy-${index + 1}`;
}

export function legacyBodyToDocument(body: readonly string[]): ArticleContentDocument {
  return {
    schemaVersion: 1,
    blocks: body.map((text, index) => ({ id: blockId(index), type: "paragraph", text })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validBlock(value: unknown): value is ArticleBlock {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id) return false;
  if (value.type === "paragraph") return typeof value.text === "string";
  if (value.type === "heading") return (value.level === 2 || value.level === 3) && typeof value.text === "string";
  return value.type === "image" && typeof value.assetId === "string" && typeof value.alt === "string"
    && (value.caption === undefined || typeof value.caption === "string")
    && (value.alignment === "inline" || value.alignment === "wide");
}

export function parseArticleContent(value: unknown): ArticleContentDocument {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return legacyBodyToDocument(value);
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.blocks) || !value.blocks.every(validBlock)) {
    throw new Error("Documento editorial inválido.");
  }
  return { schemaVersion: 1, blocks: value.blocks };
}

export function articleText(document: ArticleContentDocument): string {
  return document.blocks.flatMap((block) => block.type === "image" ? [] : [block.text]).join("\n\n");
}

export function referencedAssetIds(document: ArticleContentDocument): readonly string[] {
  return [...new Set(document.blocks.flatMap((block) => block.type === "image" ? [block.assetId] : []))];
}
