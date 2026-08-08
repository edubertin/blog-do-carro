import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import { Fire } from "@phosphor-icons/react/dist/ssr/Fire";
import { TrendUp } from "@phosphor-icons/react/dist/ssr/TrendUp";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import type { CatalogProduct } from "@/db/contracts";
import type { HomeProjection, PublicArticle, PublicCategoryGroup } from "@/domain/public-content";
import { NewsletterForm } from "./lead-forms";
import { HomeStoreCarousel } from "./commerce/home-store-carousel";
import { Reveal } from "./motion";
import { VideoCarousel } from "./video-carousel";

function UtilityStrip() {
  return <div className="utilityStrip"><span>Vídeo novo no canal</span><span>Blog + análise</span></div>;
}

function SectionHeading({ title, icon = false }: { title: string; icon?: boolean }) {
  return <div className="sectionHeading"><h2>{title}</h2>{icon ? <Fire size={19} weight="fill" aria-hidden="true" /> : null}</div>;
}

function ArticleRow({ article }: { article: PublicArticle }) {
  return (
    <Link className="articleRow" href={`/artigos/${article.slug}`}>
      <div className="articleThumb"><Image src={article.image} alt="" fill sizes="112px" /></div>
      <div className="articleRowCopy"><span className="articleCategory">{article.category}</span><h3>{article.title}</h3><span className="readTime"><Clock size={13} />{article.readTime}</span></div>
      <span className="rowArrow" aria-hidden="true"><ArrowRight size={18} /></span>
    </Link>
  );
}

function LatestArticles({ articles }: { articles: readonly PublicArticle[] }) {
  return (
    <Reveal className="contentSection" delay={0.08}>
      <SectionHeading title="Agora no Blog" />
      <div className="articleList">{articles.slice(0, 3).map((article) => <ArticleRow article={article} key={article.slug} />)}</div>
    </Reveal>
  );
}

function CategoryGroup({ group }: { group: PublicCategoryGroup }) {
  return (
    <details className="categoryGroup" open={group.index === "01"}>
      <summary><div className="categoryGroupIntro"><span>{group.index}</span><div><h3>{group.title}</h3><p>{group.description}</p></div></div><CaretDown size={19} weight="bold" /></summary>
      <nav aria-label={group.title}>{group.items.map((category) => <Link href={`/categoria/${category.slug}`} key={category.slug}><span>{category.name}</span><ArrowRight size={16} /></Link>)}</nav>
    </details>
  );
}

function CategoryIndex({ groups }: { groups: readonly PublicCategoryGroup[] }) {
  return (
    <Reveal className="contentSection categoryIndex" delay={0.1} id="categorias">
      <span className="eyebrow">Navegação editorial</span><SectionHeading title="O que você quer resolver?" />
      <div>{groups.map((group) => <CategoryGroup group={group} key={group.index} />)}</div>
    </Reveal>
  );
}

function PopularArticles({ articles }: { articles: readonly PublicArticle[] }) {
  return (
    <Reveal className="contentSection popularSection" delay={0.14}>
      <SectionHeading title="Leituras em destaque" icon />
      <div className="popularList">{articles.slice(0, 4).map((article, index) => <Link className="popularRow" href={`/artigos/${article.slug}`} key={article.slug}><span>0{index + 1}</span><h3>{article.title}</h3><TrendUp size={18} aria-hidden="true" /></Link>)}</div>
    </Reveal>
  );
}

function Newsletter() {
  return (
    <Reveal className="newsletter" delay={0.16}>
      <span className="eyebrow">Direto ao ponto</span><h2>A informação que ajuda você a fazer negócio.</h2><p>Receba as análises de cada vídeo novo, sem ruído.</p><NewsletterForm />
    </Reveal>
  );
}

type HomePageProps = Readonly<{
  projection: HomeProjection;
  products: readonly CatalogProduct[];
}>;

export function HomePage({ projection, products }: HomePageProps): ReactElement {
  return <><UtilityStrip /><main><VideoCarousel videos={projection.featuredVideos} /><div className="homeGrid" id="ultimos"><LatestArticles articles={projection.latestArticles} /><CategoryIndex groups={projection.categoryGroups} /><Reveal className="contentSection homeStoreSection" delay={0.12}><HomeStoreCarousel products={products} /></Reveal><PopularArticles articles={projection.popularArticles} /></div><Newsletter /></main></>;
}
