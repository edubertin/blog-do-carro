import type { MetadataRoute } from "next";
import { categories, publishedArticles, slugifyCategory } from "./lib/content";

const baseUrl = "https://blogdocarro.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/sobre", "/contato", "/marketplace", "/loja", "/loja/chaveiro-presente", "/privacidade", "/termos"];
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
  const articleEntries = publishedArticles.map((article) => ({
    url: `${baseUrl}/artigos/${article.slug}`,
    lastModified: article.updatedAt ?? article.publishedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const categoryEntries = categories.map((category) => ({
    url: `${baseUrl}/categoria/${slugifyCategory(category)}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [...staticEntries, ...articleEntries, ...categoryEntries];
}
