import type { Metadata } from "next";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { getCategoryPageProjection, listPublicCategories } from "@/server/public-content-service";

type CategoryRouteProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const categories = await listPublicCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const slug = (await params).slug;
  const projection = await getCategoryPageProjection(slug);
  return projection ? {
    title: projection.category.name,
    description: `Artigos do Blog do Carro sobre ${projection.category.name}.`,
    alternates: { canonical: `/categoria/${slug}` },
  } : {};
}

export default async function CategoryPage({ params }: CategoryRouteProps): Promise<ReactElement> {
  const projection = await getCategoryPageProjection((await params).slug);
  if (!projection) notFound();
  const { category, articles } = projection;
  return (
    <main className="listingPage"><span className="eyebrow">Categoria</span><h1>{category.name}</h1><p>Conteúdo direto para ajudar você a entender o mercado e negociar melhor.</p>{articles.length ? <div className="listingGrid">{articles.map((article) => <Link href={`/artigos/${article.slug}`} key={article.slug}><div><Image src={article.image} alt="" fill sizes="(max-width: 760px) 100vw, 360px" /></div><span>{article.category}</span><h2>{article.title}</h2><p>{article.subtitle}</p></Link>)}</div> : <section className="categoryEmpty"><span>Garagem em preparação</span><h2>Os primeiros conteúdos de {category.name} estão a caminho.</h2><p>Enquanto isso, veja as análises e negociações que já publicamos.</p><Link className="primaryButton inlineButton" href="/">Explorar artigos</Link></section>}</main>
  );
}
