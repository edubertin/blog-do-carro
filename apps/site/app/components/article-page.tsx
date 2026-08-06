import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { Play } from "@phosphor-icons/react/dist/ssr/Play";
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import type { Article } from "@/app/lib/content";
import { articles, slugifyCategory } from "@/app/lib/content";
import { Comments } from "./comments";
import { Reveal } from "./motion";
import { YouTubeConsentEmbed } from "./youtube-consent-embed";

function Breadcrumbs({ article }: { article: Article }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Início</Link><span>/</span><Link href={`/categoria/${slugifyCategory(article.category)}`}>{article.category}</Link><span>/</span><strong>Artigo</strong></nav>;
}

function ArticleIntro({ article }: { article: Article }) {
  return (
    <header className="articleIntro">
      <Link className="backLink" href="/"><ArrowLeft size={17} />Voltar ao início</Link>
      <Breadcrumbs article={article} />
      <span className="eyebrow">{article.category}</span>
      <h1>{article.title}</h1>
      <p>{article.subtitle}</p>
      <div className="articleMeta"><span>{article.dateLabel}</span><span>{article.readTime}</span></div>
    </header>
  );
}

function Opinion({ text }: { text: string }) {
  return (
    <aside className="opinionBox">
      <Quotes size={28} weight="fill" aria-hidden="true" />
      <div><span className="eyebrow">Minha opinião</span><p>{text}</p></div>
    </aside>
  );
}

function VideoFacade({ article }: { article: Article }) {
  if (article.videoId) {
    return (
      <section className="videoSection">
        <div className="articleSectionTitle"><span className="eyebrow">Assista também</span><h2>O vídeo que abriu a conversa</h2></div>
        <YouTubeConsentEmbed videoId={article.videoId} title={article.title} posterSrc={article.image} />
      </section>
    );
  }
  const query = encodeURIComponent(`Blog do Carro ${article.title}`);
  return (
    <section className="videoSection">
      <div className="articleSectionTitle"><span className="eyebrow">Assista também</span><h2>Vídeo do Blog do Carro</h2></div>
      <a className="videoFacade" href={`https://www.youtube.com/results?search_query=${query}`} target="_blank" rel="noreferrer">
        <Image src={article.image} alt="" fill sizes="(max-width: 760px) 100vw, 760px" />
        <span><Play size={28} weight="fill" />Abrir no YouTube</span>
      </a>
    </section>
  );
}

function Faq({ article }: { article: Article }) {
  return (
    <section className="articleBlock">
      <div className="articleSectionTitle"><span className="eyebrow">Perguntas frequentes</span><h2>FAQ</h2></div>
      <div className="faqList">{article.faq.map((item, index) => <details open={index === 0} key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
  );
}

function findRelatedArticles(article: Article): Article[] {
  const candidates = articles.filter((item) => item.slug !== article.slug);
  const sameCategory = candidates.filter((item) => item.category === article.category);
  const otherCategories = candidates.filter((item) => item.category !== article.category);
  return [...sameCategory, ...otherCategories].slice(0, 2);
}

function Related({ article }: { article: Article }) {
  const related = findRelatedArticles(article);
  return (
    <section className="articleBlock">
      <div className="articleSectionTitle"><span className="eyebrow">Continue lendo</span><h2>Artigos relacionados</h2></div>
      <div className="relatedGrid">{related.map((item) => <Link href={`/artigos/${item.slug}`} key={item.slug}><div><Image src={item.image} alt="" fill sizes="320px" /></div><span>{item.category}</span><h3>{item.title}</h3></Link>)}</div>
    </section>
  );
}

export function ArticlePage({ article }: { article: Article }): ReactElement {
  return (
    <main className="articlePage">
      <Reveal><ArticleIntro article={article} /></Reveal>
      <Reveal className="articleLeadImage"><Image src={article.image} alt={article.imageAlt} fill loading="eager" fetchPriority="high" sizes="(max-width: 1023px) 100vw, 980px" /></Reveal>
      <article className="articleBody">{article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Opinion text={article.opinion} /><VideoFacade article={article} /><Faq article={article} /><Related article={article} /><section className="articleBlock commentsBlock"><div className="articleSectionTitle"><span className="eyebrow">Comunidade</span><h2>Comentários</h2></div><Comments /></section></article>
    </main>
  );
}
