"use client";

import { ArrowLeft, ArrowRight, Storefront } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { PointerEvent, ReactElement } from "react";
import { useCart } from "@/app/commerce/cart-provider";
import { formatMoney, isProductId } from "@/app/commerce/catalog";
import { SiteLink as Link } from "@/app/components/site-link";
import type { CatalogProduct } from "@/db/contracts";

type CarouselProps = Readonly<{ products: readonly CatalogProduct[] }>;
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

function ProductSlide({ product, index, count, active, onAdd }: Readonly<{
  product: CatalogProduct; index: number; count: number; active: boolean; onAdd: () => void;
}>): ReactElement {
  return (
    <article className="homeStoreSlide" aria-roledescription="slide" aria-label={`${index + 1} de ${count}: ${product.name}`} aria-hidden={!active} inert={!active}>
      <div className="homeStoreImage"><Image src={product.imageUrl} alt={product.imageAlt} fill sizes="(max-width: 759px) 100vw, 520px" /></div>
      <div className="homeStoreCopy">
        <p className="homeStoreLabel">Produto da comunidade</p><h2>{product.name}</h2>
        <p className="homeStoreDescription">{product.description}</p><strong>{formatMoney(product.priceCents)}</strong><small>Valor demonstrativo</small>
        <div className="homeStoreActions"><button type="button" onClick={onAdd}>Adicionar ao carrinho<ArrowRight size={18} weight="bold" aria-hidden="true" /></button><Link href="/loja">Ver detalhes</Link></div>
      </div>
    </article>
  );
}

function CarouselControls({ products, activeIndex, goTo }: Readonly<{
  products: readonly CatalogProduct[]; activeIndex: number; goTo: (index: number) => void;
}>): ReactElement {
  return <div className="homeStoreControls"><button type="button" aria-label="Produto anterior" onClick={() => goTo(activeIndex - 1)}><ArrowLeft size={19} aria-hidden="true" /></button><div className="homeStoreDots" aria-label="Escolher produto">{products.map((product, index) => <button type="button" className={index === activeIndex ? "active" : ""} aria-label={`Mostrar ${product.name}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => goTo(index)} key={product.id} />)}</div><button type="button" aria-label="Próximo produto" onClick={() => goTo(activeIndex + 1)}><ArrowRight size={19} aria-hidden="true" /></button></div>;
}

export function HomeStoreCarousel({ products }: CarouselProps): ReactElement | null {
  const [activeIndex, setActiveIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const { addProduct } = useCart();
  const goTo = (index: number): void => setActiveIndex((index + products.length) % products.length);
  const swipe = useSwipe(() => goTo(activeIndex - 1), () => goTo(activeIndex + 1));
  if (products.length === 0) return null;
  const activeProduct = products[activeIndex];
  const addActiveProduct = (): void => {
    if (!isProductId(activeProduct.id)) return setAnnouncement("Este produto ainda não pode ser adicionado ao carrinho.");
    addProduct(activeProduct.id, 1);
    setAnnouncement(`${activeProduct.name} adicionado. Abrindo o carrinho.`);
    window.location.assign("/carrinho");
  };
  return (
    <section className="homeStoreCarousel" aria-roledescription="carrossel" aria-label="Produtos da Loja da comunidade">
      <div className="homeStoreHeading"><span className="storeBadge"><Storefront size={15} weight="fill" aria-hidden="true" />Loja da comunidade</span><span>{String(activeIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</span></div>
      <div className="homeStoreViewport" role="group" aria-label="Arraste para trocar de produto" {...swipe}><div className="homeStoreTrack" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>{products.map((product, index) => <ProductSlide product={product} index={index} count={products.length} active={index === activeIndex} onAdd={addActiveProduct} key={product.id} />)}</div></div>
      <CarouselControls products={products} activeIndex={activeIndex} goTo={goTo} />
      <p className="srOnly" aria-live="polite">{announcement}</p>
    </section>
  );
}
