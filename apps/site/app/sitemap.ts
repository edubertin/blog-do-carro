import type { MetadataRoute } from "next";
import { listPublicCategories, listPublishedArticles } from "@/server/public-content-service";

const baseUrl = "https://blogdocarro.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    listPublishedArticles(),
    listPublicCategories(),
  ]);
  const staticRoutes = ["", "/sobre", "/contato", "/marketplace", "/loja", "/loja/chaveiro-presente", "/privacidade", "/termos"];
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}/artigos/${article.slug}`,
    lastModified: article.updatedAt ?? article.publishedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const categoryEntries = categories.map((category) => ({
    url: `${baseUrl}/categoria/${category.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [...staticEntries, ...articleEntries, ...categoryEntries];
}
