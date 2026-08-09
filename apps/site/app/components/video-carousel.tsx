"use client";

import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Article } from "@phosphor-icons/react/Article";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { SiteLink as Link } from "@/app/components/site-link";
import { isManagedMediaPath } from "@/domain/media-path";
import type { PanInfo } from "motion/react";
import type { ReactElement } from "react";

export type ArticleCarouselItem = Readonly<{
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  readTime: string;
  image: string;
  imageAlt: string;
}>;

function ArticleAction({ articleSlug }: { articleSlug: string }) {
  return <div className="videoActions"><Link href={`/artigos/${articleSlug}`}><Article size={20} />Ler artigo<ArrowRight size={17} weight="bold" /></Link></div>;
}

type CarouselControlsProps = Readonly<{
  index: number;
  articles: readonly ArticleCarouselItem[];
  onMove: (step: number) => void;
  onSelect: (index: number) => void;
}>;

function CarouselControls({ index, articles, onMove, onSelect }: CarouselControlsProps) {
  if (articles.length < 2) return null;
  return (
    <div className="carouselControls">
      <button type="button" onClick={() => onMove(-1)} aria-label="Artigo anterior"><ArrowLeft size={18} weight="bold" /></button>
      <div className="carouselDots">{articles.map((article, itemIndex) => <button className={itemIndex === index ? "active" : ""} type="button" onClick={() => onSelect(itemIndex)} aria-label={`Mostrar artigo ${article.title}`} aria-current={itemIndex === index} key={article.slug} />)}</div>
      <span>{String(index + 1).padStart(2, "0")} / {String(articles.length).padStart(2, "0")}</span>
      <button type="button" onClick={() => onMove(1)} aria-label="Próximo artigo"><ArrowRight size={18} weight="bold" /></button>
    </div>
  );
}

export function ArticleCarousel({ articles }: Readonly<{ articles: readonly ArticleCarouselItem[] }>): ReactElement | null {
  const [index, setIndex] = useState(0);
  if (!articles.length) return null;
  const article = articles[index] ?? articles[0];
  const hasMultipleArticles = articles.length > 1;
  function move(step: number) {
    setIndex((current) => (current + step + articles.length) % articles.length);
  }
  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (!hasMultipleArticles) return;
    if (Math.abs(info.offset.x) > 52) move(info.offset.x < 0 ? 1 : -1);
  }
  return (
    <section className="videoCarousel" aria-roledescription={hasMultipleArticles ? "carrossel" : undefined} aria-label="Artigos em destaque">
      <AnimatePresence mode="wait">
        <m.div className="videoSlide" key={article.slug} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }} drag={hasMultipleArticles ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.08} onDragEnd={handleDragEnd}>
          <Link className="videoFrame" href={`/artigos/${article.slug}`} aria-label={`Ler artigo: ${article.title}`}><Image src={article.image} alt={article.imageAlt} fill loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="(max-width: 759px) 100vw, (max-width: 1199px) 60vw, 700px" unoptimized={isManagedMediaPath(article.image)} /></Link>
          <div className="videoSlideShade" />
          <div className="videoSlideCopy">
            <span className="videoBadge"><Article size={15} weight="fill" />Agora no Blog</span>
            <p className="videoKicker">{article.category}</p><h1><Link href={`/artigos/${article.slug}`}>{article.title}</Link></h1>
            <p className="videoSupport">{article.subtitle}</p>
            <div className="videoMeta"><span>{article.dateLabel}</span><span>{article.readTime}</span></div>
            <ArticleAction articleSlug={article.slug} />
          </div>
          {hasMultipleArticles ? <span className="srOnly" role="status" aria-live="polite">Artigo {index + 1} de {articles.length}: {article.title}</span> : null}
        </m.div>
      </AnimatePresence>
      <CarouselControls index={index} articles={articles} onMove={move} onSelect={setIndex} />
    </section>
  );
}
