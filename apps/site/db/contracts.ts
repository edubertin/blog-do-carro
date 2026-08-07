import type { ProductState } from "./schema";
import type {
  PublicArticle,
  PublicCategory,
  PublicCategoryGroup,
  PublicFeaturedVideo,
  PublicNavigationItem,
  PublicSearchDocument,
} from "../domain/public-content";

export type CatalogProduct = Readonly<{
  id: string;
  variantId: string;
  slug: string;
  sku: string;
  name: string;
  collectionName: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  status: ProductState;
  currency: "BRL";
  priceCents: number;
  priceKind: "illustrative" | "sale";
  maxPerCart: number;
  inventoryMode: "untracked" | "tracked";
}>;

export interface PublishedContentRepository {
  listPublishedArticles(limit: number): Promise<readonly PublicArticle[]>;
  listPopularArticles(limit: number): Promise<readonly PublicArticle[]>;
  listPublishedArticlesByCategory(categorySlug: string, limit: number): Promise<readonly PublicArticle[]>;
  listRelatedArticles(article: PublicArticle, limit: number): Promise<readonly PublicArticle[]>;
  findPublishedArticleBySlug(slug: string): Promise<PublicArticle | null>;
  listCategories(): Promise<readonly PublicCategory[]>;
  listCategoryGroups(): Promise<readonly PublicCategoryGroup[]>;
  listFeaturedVideos(): Promise<readonly PublicFeaturedVideo[]>;
  listNavigationItems(): Promise<readonly PublicNavigationItem[]>;
  searchPublishedArticles(query: string, limit: number): Promise<readonly PublicSearchDocument[]>;
}

export interface CatalogRepository {
  listCatalogProducts(): Promise<readonly CatalogProduct[]>;
  findCatalogProductBySlug(slug: string): Promise<CatalogProduct | null>;
}

export type FoundationRepositorySeed = Readonly<{
  articles: readonly PublicArticle[];
  categories: readonly PublicCategory[];
  categoryGroups: readonly PublicCategoryGroup[];
  featuredVideos: readonly PublicFeaturedVideo[];
  navigationItems: readonly PublicNavigationItem[];
  products: readonly CatalogProduct[];
}>;

export type DataRepositories = Readonly<{
  publishedContent: PublishedContentRepository;
  catalog: CatalogRepository;
}>;

export class PersistenceDisabledError extends Error {
  constructor() {
    super("A persistência D1 ainda não foi ativada para este ambiente.");
    this.name = "PersistenceDisabledError";
  }
}
