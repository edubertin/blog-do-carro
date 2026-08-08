import { cache } from "react";
import type {
  ArticlePageProjection,
  CategoryPageProjection,
  HomeProjection,
  NavigationProjection,
  PublicArticle,
  PublicCategory,
  PublicSearchDocument,
} from "../domain/public-content";
import type { CatalogProduct } from "../db/contracts";
import { getDataRepositories } from "./repositories";

const contentRepository = getDataRepositories().publishedContent;
const catalogRepository = getDataRepositories().catalog;

export const getNavigationProjection = cache(async (): Promise<NavigationProjection> => {
  const [items, categories, suggested] = await Promise.all([
    contentRepository.listNavigationItems(),
    contentRepository.listCategories(),
    contentRepository.listPublishedArticles(5),
  ]);
  const suggestedArticles = suggested.map(({ slug, category, title, subtitle }) => ({ slug, category, title, subtitle }));
  return { items, categories, suggestedArticles };
});

export const getHomeProjection = cache(async (): Promise<HomeProjection> => {
  const [latestArticles, popularArticles, categoryGroups, featuredVideos] = await Promise.all([
    contentRepository.listPublishedArticles(8),
    contentRepository.listPopularArticles(4),
    contentRepository.listCategoryGroups(),
    contentRepository.listFeaturedVideos(),
  ]);
  return { latestArticles, popularArticles, categoryGroups, featuredVideos };
});

export const getArticlePageProjection = cache(async (slug: string): Promise<ArticlePageProjection | null> => {
  const article = await contentRepository.findPublishedArticleBySlug(slug);
  if (!article) return null;
  const relatedArticles = await contentRepository.listRelatedArticles(article, 2);
  return { article, relatedArticles };
});

export const getCategoryPageProjection = cache(async (slug: string): Promise<CategoryPageProjection | null> => {
  const categories = await contentRepository.listCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return null;
  const articles = await contentRepository.listPublishedArticlesByCategory(slug, 100);
  return { category, articles };
});

export async function listPublishedArticles(limit = 100): Promise<readonly PublicArticle[]> {
  return contentRepository.listPublishedArticles(limit);
}

export async function listPublicCategories(): Promise<readonly PublicCategory[]> {
  return contentRepository.listCategories();
}

export async function searchPublishedArticles(query: string, limit = 8): Promise<readonly PublicSearchDocument[]> {
  return contentRepository.searchPublishedArticles(query, limit);
}

export const getCatalogProduct = cache(async (slug: string): Promise<CatalogProduct | null> => {
  return catalogRepository.findCatalogProductBySlug(slug);
});

export const listCatalogProducts = cache(async (): Promise<readonly CatalogProduct[]> => {
  return catalogRepository.listCatalogProducts();
});
