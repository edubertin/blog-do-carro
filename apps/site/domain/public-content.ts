export type PublicFaq = Readonly<{
  question: string;
  answer: string;
}>;

export type PublicArticle = Readonly<{
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  subtitle: string;
  seoDescription: string;
  dateLabel: string;
  publishedAt?: string;
  updatedAt?: string;
  readTime: string;
  image: string;
  imageAlt: string;
  videoId?: string;
  body: ArticleContentDocument | readonly string[];
  opinion: string;
  faq: readonly PublicFaq[];
}>;

export type PublicCategory = Readonly<{
  name: string;
  slug: string;
}>;

export type PublicCategoryGroup = Readonly<{
  index: string;
  title: string;
  description: string;
  items: readonly PublicCategory[];
}>;

export type PublicFeaturedVideo = Readonly<{
  id: string;
  sourceTitle: string;
  editorialTitle: string;
  question: string;
  views: string;
  image: string;
  articleSlug: string;
}>;

export type PublicSearchDocument = Readonly<{
  slug: string;
  category: string;
  title: string;
  subtitle: string;
}>;

export type PublicNavigationItem = Readonly<{
  label: string;
  href: string;
}>;

export type NavigationProjection = Readonly<{
  items: readonly PublicNavigationItem[];
  categories: readonly PublicCategory[];
  suggestedArticles: readonly PublicSearchDocument[];
}>;

export type HomeProjection = Readonly<{
  latestArticles: readonly PublicArticle[];
  popularArticles: readonly PublicArticle[];
  categoryGroups: readonly PublicCategoryGroup[];
  featuredVideos: readonly PublicFeaturedVideo[];
}>;

export type ArticlePageProjection = Readonly<{
  article: PublicArticle;
  relatedArticles: readonly PublicArticle[];
}>;

export type CategoryPageProjection = Readonly<{
  category: PublicCategory;
  articles: readonly PublicArticle[];
}>;
import type { ArticleContentDocument } from "./article-content";
