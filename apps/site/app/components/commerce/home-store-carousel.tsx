"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactElement } from "react";
import { formatMoney } from "@/app/commerce/catalog";
import { StoreInterestForm } from "@/app/components/lead-forms";
import type { AudiencePublicConfig } from "@/app/components/lead-forms";
import { productAvailability } from "@/db/contracts";
import type { CatalogProduct } from "@/db/contracts";

type CarouselProps = Readonly<{ products: readonly CatalogProduct[]; audienceConfig: AudiencePublicConfig }>;
type SwipeOrigin = Readonly<{ x: number; y: number }>;

function useSwipe(onPrevious: () => void, onNext: () => void) {
  const origin = useRef<SwipeOrigin | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== "mouse") origin.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    const start = origin.current;
    origin.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX < 0) onNext(); else onPrevious();
  };
  return { onPointerDown, onPointerUp };
}

function useCarouselVisibility(container: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [container]);
  return visible;
}

function ProductSlide({ product, index, count, active, audienceConfig }: Readonly<{
  product: CatalogProduct; index: number; count: number; active: boolean; audienceConfig: AudiencePublicConfig;
}>): ReactElement {
  const availability = productAvailability(product);
  return (
    <article className="homeStoreSlide" aria-roledescription="slide" aria-label={`${index + 1} de ${count}: ${product.name}`} aria-hidden={!active} inert={!active}>
      <div className="homeStoreImage"><Image src={product.imageUrl} alt={product.imageAlt} fill sizes="(max-width: 759px) 100vw, 520px" /></div>
      <div className="homeStoreCopy">
        <p className="homeStoreLabel">Loja da comunidade · Em breve</p>
        <h2>{product.name}</h2><p className="homeStoreDescription">{product.description}</p>
        {availability === "available" ? <><strong>{formatMoney(product.priceCents)}</strong><small>Preço planejado para o lançamento</small></> : <p className="homeStoreSoon">Produto em desenvolvimento.</p>}
        <details className="homeStoreInterest"><summary>Avise-me no lançamento<ArrowRight size={18} weight="bold" aria-hidden="true" /></summary><StoreInterestForm config={audienceConfig} productId={product.slug} /></details>
      </div>
    </article>
  );
}

function CarouselControls({ products, activeIndex, goTo }: Readonly<{
  products: readonly CatalogProduct[]; activeIndex: number; goTo: (index: number) => void;
}>): ReactElement {
  return <><button className="homeStoreArrow homeStoreArrow--previous" type="button" aria-label="Produto anterior" onClick={() => goTo(activeIndex - 1)}><ArrowLeft size={19} aria-hidden="true" /></button><button className="homeStoreArrow homeStoreArrow--next" type="button" aria-label="Próximo produto" onClick={() => goTo(activeIndex + 1)}><ArrowRight size={19} aria-hidden="true" /></button><div className="homeStoreDots" aria-label="Escolher produto">{products.map((product, index) => <button type="button" className={index === activeIndex ? "active" : ""} aria-label={`Mostrar ${product.name}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => goTo(index)} key={product.id} />)}</div></>;
}

export function HomeStoreCarousel({ products, audienceConfig }: CarouselProps): ReactElement | null {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const container = useRef<HTMLElement | null>(null);
  const visible = useCarouselVisibility(container);
  const goTo = (index: number): void => setActiveIndex((index + products.length) % products.length);
  const swipe = useSwipe(() => goTo(activeIndex - 1), () => goTo(activeIndex + 1));
  useEffect(() => {
    if (paused || !visible || products.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % products.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, products.length, visible]);
  if (products.length === 0) return null;
  return (
    <section ref={container} className="homeStoreCarousel" aria-roledescription="carrossel" aria-label="Produtos da Loja da comunidade" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <p className="homeStoreTitle">Loja da comunidade</p>
      <div className="homeStoreViewport" role="group" aria-label="Arraste para trocar de produto" {...swipe} onPointerDownCapture={() => setPaused(true)} onPointerUpCapture={() => setPaused(false)}><div className="homeStoreTrack" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>{products.map((product, index) => <ProductSlide product={product} index={index} count={products.length} active={index === activeIndex} audienceConfig={audienceConfig} key={product.id} />)}</div></div>
      <CarouselControls products={products} activeIndex={activeIndex} goTo={goTo} />
    </section>
  );
}
