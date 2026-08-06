"use client";

import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Article } from "@phosphor-icons/react/Article";
import { PlayCircle } from "@phosphor-icons/react/PlayCircle";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import { useState } from "react";
import type { PanInfo } from "motion/react";
import type { ReactElement } from "react";
import { featuredVideos } from "@/app/lib/content";

function VideoActions({ videoId, articleSlug }: { videoId: string; articleSlug: string }) {
  return (
    <div className="videoActions">
      <a href={`https://www.youtube.com/shorts/${videoId}`} target="_blank" rel="noreferrer"><PlayCircle size={21} weight="fill" />Assistir</a>
      <Link href={`/artigos/${articleSlug}`}><Article size={20} />Ler análise</Link>
    </div>
  );
}

function CarouselControls({ index, onMove, onSelect }: { index: number; onMove: (step: number) => void; onSelect: (index: number) => void }) {
  return (
    <div className="carouselControls">
      <button type="button" onClick={() => onMove(-1)} aria-label="Vídeo anterior"><ArrowLeft size={18} weight="bold" /></button>
      <div className="carouselDots">{featuredVideos.map((video, itemIndex) => <button className={itemIndex === index ? "active" : ""} type="button" onClick={() => onSelect(itemIndex)} aria-label={`Mostrar ${video.editorialTitle}`} aria-current={itemIndex === index} key={video.id} />)}</div>
      <span>{String(index + 1).padStart(2, "0")} / {String(featuredVideos.length).padStart(2, "0")}</span>
      <button type="button" onClick={() => onMove(1)} aria-label="Próximo vídeo"><ArrowRight size={18} weight="bold" /></button>
    </div>
  );
}

export function VideoCarousel(): ReactElement {
  const [index, setIndex] = useState(0);
  const video = featuredVideos[index];
  function move(step: number) {
    setIndex((current) => (current + step + featuredVideos.length) % featuredVideos.length);
  }
  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 52) move(info.offset.x < 0 ? 1 : -1);
  }
  return (
    <section className="videoCarousel" aria-roledescription="carrossel" aria-label="Últimos vídeos do canal Deu Negócio">
      <AnimatePresence mode="wait">
        <m.div className="videoSlide" key={video.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .34, ease: [0.22, 1, 0.36, 1] }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.08} onDragEnd={handleDragEnd}>
          <div className="videoFrame"><Image src={video.image} alt={`Frame do vídeo ${video.sourceTitle}`} fill loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="(max-width: 1023px) 100vw, 430px" /></div>
          <div className="videoSlideShade" />
          <div className="videoSlideCopy" aria-live="polite">
            <span className="videoBadge"><PlayCircle size={15} weight="fill" />Agora no canal</span>
            <p className="videoKicker">{video.editorialTitle}</p><h1>{video.question}</h1>
            <p className="videoSupport">No Blog do Carro: análise, riscos e o que observar antes de fechar.</p>
            <div className="videoMeta"><span>Vídeo novo</span><span>{video.views}</span></div>
            <VideoActions videoId={video.id} articleSlug={video.articleSlug} />
          </div>
        </m.div>
      </AnimatePresence>
      <CarouselControls index={index} onMove={move} onSelect={setIndex} />
    </section>
  );
}
