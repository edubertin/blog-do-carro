import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ArticlePage } from "@/app/components/article-page";
import type { PublicArticle } from "@/domain/public-content";
import { getArticlePageProjection, listPublishedArticles } from "@/server/public-content-service";

type ArticleRouteProps = { params: Promise<{ slug: string }> };
type JsonLdNode = Readonly<Record<string, unknown>>;

const baseUrl = "https://blogdocarro.com";
const organizationId = `${baseUrl}/#organization`;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const articles = await listPublishedArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticleRouteProps): Promise<Metadata> {
  const projection = await getArticlePageProjection((await params).slug);
  if (!projection) return {};
  const { article } = projection;
  return {
    title: article.title,
    description: article.seoDescription,
    alternates: { canonical: `/artigos/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.seoDescription,
      images: [article.image],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  };
}

function organizationSchema(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: "Blog do Carro",
    url: baseUrl,
    logo: { "@type": "ImageObject", url: `${baseUrl}/brand/blog-do-carro-logo.png` },
  };
}

function breadcrumbSchema(article: PublicArticle): JsonLdNode {
  const categoryUrl = `${baseUrl}/categoria/${article.categorySlug}`;
  return {
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}/artigos/${article.slug}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: baseUrl },
      { "@type": "ListItem", position: 2, name: article.category, item: categoryUrl },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };
}

function articleSchema(article: PublicArticle): JsonLdNode {
  const articleUrl = `${baseUrl}/artigos/${article.slug}`;
  return {
    "@type": "Article",
    "@id": `${articleUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    headline: article.title,
    description: article.seoDescription,
    image: `${baseUrl}${article.image}`,
    articleSection: article.category,
    inLanguage: "pt-BR",
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: { "@id": organizationId },
    publisher: { "@id": organizationId },
  };
}

function faqSchema(article: PublicArticle): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": `${baseUrl}/artigos/${article.slug}#faq`,
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function serializeArticleGraph(article: PublicArticle): string {
  const graph = [organizationSchema(), breadcrumbSchema(article), articleSchema(article), faqSchema(article)];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

export default async function ArticleRoute({ params }: ArticleRouteProps): Promise<ReactElement> {
  const projection = await getArticlePageProjection((await params).slug);
  if (!projection) notFound();
  const { article, relatedArticles } = projection;
  const jsonLd = serializeArticleGraph(article);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /><ArticlePage article={article} relatedArticles={relatedArticles} /></>;
}
