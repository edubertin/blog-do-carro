import type { Metadata } from "next";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { categories, articles, slugifyCategory } from "@/app/lib/content";

type CategoryRouteProps = { params: Promise<{ slug: string }> };

function findCategory(slug: string): string | undefined {
  return categories.find((category) => slugifyCategory(category) === slug);
}

export function generateStaticParams(): Array<{ slug: string }> {
  return categories.map((category) => ({ slug: slugifyCategory(category) }));
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const slug = (await params).slug;
  const category = findCategory(slug);
  return category ? {
    title: category,
    description: `Artigos do Blog do Carro sobre ${category}.`,
    alternates: { canonical: `/categoria/${slug}` },
  } : {};
}

export default async function CategoryPage({ params }: CategoryRouteProps): Promise<ReactElement> {
  const category = findCategory((await params).slug);
  if (!category) notFound();
  const matches = articles.filter((article) => article.category === category);
  return (
    <main className="listingPage"><span className="eyebrow">Categoria</span><h1>{category}</h1><p>Conteúdo direto para ajudar você a entender o mercado e negociar melhor.</p>{matches.length ? <div className="listingGrid">{matches.map((article) => <Link href={`/artigos/${article.slug}`} key={article.slug}><div><Image src={article.image} alt="" fill sizes="(max-width: 760px) 100vw, 360px" /></div><span>{article.category}</span><h2>{article.title}</h2><p>{article.subtitle}</p></Link>)}</div> : <section className="categoryEmpty"><span>Garagem em preparação</span><h2>Os primeiros conteúdos de {category} estão a caminho.</h2><p>Enquanto isso, veja as análises e negociações que já publicamos.</p><Link className="primaryButton inlineButton" href="/">Explorar artigos</Link></section>}</main>
  );
}
