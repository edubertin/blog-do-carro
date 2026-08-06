import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/app/components/article-page";
import { articles, findArticle } from "@/app/lib/content";

type ArticleRouteProps = { params: Promise<{ slug: string }> };

export function generateStaticParams(): Array<{ slug: string }> {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticleRouteProps): Promise<Metadata> {
  const article = findArticle((await params).slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.subtitle,
    alternates: { canonical: `/artigos/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.subtitle,
      images: [article.image],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  };
}

export default async function ArticleRoute({ params }: ArticleRouteProps): Promise<ReactElement> {
  const article = findArticle((await params).slug);
  if (!article) notFound();
  const articleSchema = {
    "@type": "Article",
    headline: article.title,
    description: article.subtitle,
    image: `https://blogdocarro.com${article.image}`,
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: { "@type": "Organization", name: "Blog do Carro" },
    publisher: { "@type": "Organization", name: "Blog do Carro" },
  };
  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const schema = { "@context": "https://schema.org", "@graph": [articleSchema, faqSchema] };
  const jsonLd = JSON.stringify(schema).replace(/</g, "\\u003c");
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /><ArticlePage article={article} /></>;
}
