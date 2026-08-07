import type {
  CatalogProduct,
  CatalogRepository,
  DataRepositories,
  FoundationRepositorySeed,
  PublishedContentRepository,
} from "../contracts";
import type { PublicArticle } from "../../domain/public-content";

function normalizedLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) return 1;
  return Math.min(limit, 100);
}

function normalizedSearchText(value: string): string {
  return value.normalize("NFD").replaceAll(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

function relatedArticles(seed: FoundationRepositorySeed, article: PublicArticle, limit: number): readonly PublicArticle[] {
  const candidates = seed.articles.filter((item) => item.slug !== article.slug);
  const sameCategory = candidates.filter((item) => item.categorySlug === article.categorySlug);
  const remaining = candidates.filter((item) => item.categorySlug !== article.categorySlug);
  return [...sameCategory, ...remaining].slice(0, normalizedLimit(limit));
}

function searchArticles(seed: FoundationRepositorySeed, query: string, limit: number) {
  const term = normalizedSearchText(query.trim());
  return seed.articles.filter((article) => {
    const searchable = [article.title, article.category, article.subtitle, ...article.body].join(" ");
    return normalizedSearchText(searchable).includes(term);
  }).slice(0, normalizedLimit(limit)).map(({ slug, category, title, subtitle }) => ({ slug, category, title, subtitle }));
}

function publishedContentRepository(seed: FoundationRepositorySeed): PublishedContentRepository {
  return {
    listPublishedArticles: async (limit) => seed.articles.slice(0, normalizedLimit(limit)),
    listPopularArticles: async (limit) => seed.articles.slice(0, normalizedLimit(limit)),
    listPublishedArticlesByCategory: async (slug, limit) => seed.articles.filter((article) => article.categorySlug === slug).slice(0, normalizedLimit(limit)),
    listRelatedArticles: async (article, limit) => relatedArticles(seed, article, limit),
    findPublishedArticleBySlug: async (slug) => seed.articles.find((article) => article.slug === slug) ?? null,
    listCategories: async () => seed.categories,
    listCategoryGroups: async () => seed.categoryGroups,
    listFeaturedVideos: async () => seed.featuredVideos,
    listNavigationItems: async () => seed.navigationItems,
    searchPublishedArticles: async (query, limit) => searchArticles(seed, query, limit),
  };
}

function catalogRepository(seed: FoundationRepositorySeed): CatalogRepository {
  return {
    async listCatalogProducts(): Promise<readonly CatalogProduct[]> {
      return seed.products;
    },
    async findCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
      return seed.products.find((product) => product.slug === slug) ?? null;
    },
  };
}

export function createMemoryRepositories(seed: FoundationRepositorySeed): DataRepositories {
  return {
    publishedContent: publishedContentRepository(seed),
    catalog: catalogRepository(seed),
  };
}
