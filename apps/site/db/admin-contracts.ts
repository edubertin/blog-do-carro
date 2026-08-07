import type { ArticleRevisionState, ProductState } from "./schema";

export type ArticleDraftInput = Readonly<{
  title: string;
  subtitle: string;
  slug: string;
  seoDescription: string;
  categorySlug: string;
  body: readonly string[];
  opinion: string;
  imageUrl: string;
  imageAlt: string;
  youtubeVideoId?: string;
  readTimeMinutes: number;
  faq: readonly Readonly<{ question: string; answer: string }>[];
}>;

export type AdminArticleSummary = Readonly<{
  id: string;
  revisionId: string;
  slug: string;
  title: string;
  category: string;
  state: ArticleRevisionState;
  version: number;
  updatedAt: number;
}>;

export type ProductDraftInput = Readonly<{
  name: string;
  slug: string;
  sku: string;
  collectionName: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  priceCents: number;
}>;

export type AdminProductSummary = Readonly<{
  id: string;
  slug: string;
  name: string;
  sku: string;
  priceCents: number;
  state: ProductState;
  version: number;
}>;

export type MenuItemInput = Readonly<{
  label: string;
  href: string;
  active: boolean;
}>;

export type HomeSectionInput = Readonly<{
  id: string;
  position: number;
}>;

export type AdminHomeSection = Readonly<{
  id: string;
  position: number;
}>;

export type AdminMenuItem = Readonly<{
  label: string;
  href: string;
  active: boolean;
}>;

export type MediaAssetRecord = Readonly<{
  id: string;
  objectKey: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
  altText: string;
}>;
