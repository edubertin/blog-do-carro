import type { DataRepositories, FoundationRepositorySeed } from "../db/contracts";
import { foundationRepositorySeed } from "../db/foundation-fixtures";
import { createDataRepositories } from "../db/repositories/repository-factory";
import type {
  PublicArticle,
  PublicCategory,
  PublicCategoryGroup,
} from "../domain/public-content";
import {
  categories,
  categoryGroups,
  featuredVideos,
  publishedArticles,
  slugifyCategory,
} from "../app/lib/content";

const navigationItems = [
  { label: "Início", href: "/" },
  { label: "Artigos", href: "/#ultimos" },
  { label: "Categorias", href: "/#categorias" },
  { label: "Loja", href: "/loja" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
  { label: "Marketplace", href: "/marketplace" },
] as const;

function publicArticle(article: (typeof publishedArticles)[number]): PublicArticle {
  return {
    ...article,
    categorySlug: slugifyCategory(article.category),
    seoDescription: article.subtitle,
  };
}

function publicCategory(name: string): PublicCategory {
  return { name, slug: slugifyCategory(name) };
}

function publicCategoryGroup(group: (typeof categoryGroups)[number]): PublicCategoryGroup {
  return {
    index: group.index,
    title: group.title,
    description: group.description,
    items: group.items.map(publicCategory),
  };
}

const fixtureSeed = {
  ...foundationRepositorySeed,
  articles: publishedArticles.map(publicArticle),
  categories: categories.map(publicCategory),
  categoryGroups: categoryGroups.map(publicCategoryGroup),
  featuredVideos,
  navigationItems,
} satisfies FoundationRepositorySeed;

const repositories = createDataRepositories({
  mode: "disabled",
  fixtureSeed,
});

export function getDataRepositories(): DataRepositories {
  return repositories;
}

export const activePersistenceMode = "fixtures" as const;
