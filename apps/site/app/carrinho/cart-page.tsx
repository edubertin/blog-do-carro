"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ShoppingCartSimple } from "@phosphor-icons/react/ShoppingCartSimple";
import { Trash } from "@phosphor-icons/react/Trash";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { useCart } from "@/app/commerce/cart-provider";
import { formatMoney } from "@/app/commerce/catalog";
import type { PurchasableProductId } from "@/app/commerce/catalog";
import { QuantityControl } from "@/app/components/commerce/quantity-control";
import type { CatalogProduct } from "@/db/contracts";

type CartPageProps = Readonly<{ products: readonly CatalogProduct[] }>;

export function CartPage({ products }: CartPageProps): ReactElement {
  const { items, ready, setQuantity, removeProduct } = useCart();
  const lines = items.flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.productId);
    return product ? [{ item, product }] : [];
  });
  if (!ready) return <CommerceLoading />;
  if (lines.length === 0) return <EmptyCart />;
  const subtotal = lines.reduce((total, line) => total + line.product.priceCents * line.item.quantity, 0);
  return (
    <div className="commerceShell cartShell">
      <CommerceHeader eyebrow="Compra simulada" title="Revise seus produtos." description="A próxima etapa coleta dados somente na memória desta página." />
      <div className="cartLayout">
        <section className="cartList" aria-label="Itens do carrinho">
          {lines.map(({ item, product }) => (
            <CartLine key={item.productId} productId={item.productId} product={product} quantity={item.quantity} onQuantityChange={setQuantity} onRemove={removeProduct} />
          ))}
          <Link className="textAction" href="/loja">â† Continuar escolhendo</Link>
        </section>
        <CartSummary subtotal={subtotal} />
      </div>
    </div>
  );
}

type CartLineProps = Readonly<{
  productId: PurchasableProductId;
  product: CatalogProduct;
  quantity: number;
  onQuantityChange: (productId: PurchasableProductId, quantity: number) => void;
  onRemove: (productId: PurchasableProductId) => void;
}>;

function CartLine({ productId, product, quantity, onQuantityChange, onRemove }: CartLineProps): ReactElement {
  return (
    <article className="cartLine">
      <div className="cartImage"><Image src={product.imageUrl} alt={product.imageAlt} fill sizes="120px" /></div>
      <div className="cartCopy"><span>{product.collectionName}</span><h2>{product.name}</h2><strong>{formatMoney(product.priceCents)} cada</strong><button type="button" onClick={() => onRemove(productId)}><Trash size={16} />Remover</button></div>
      <QuantityControl quantity={quantity} maximum={product.maxPerCart} onChange={(next) => onQuantityChange(productId, next)} />
      <b className="cartLineTotal">{formatMoney(product.priceCents * quantity)}</b>
    </article>
  );
}

function CommerceHeader(props: Readonly<{ eyebrow: string; title: string; description: string }>): ReactElement {
  return <header className="commerceIntro"><span className="eyebrow">{props.eyebrow}</span><h1>{props.title}</h1><p>{props.description}</p></header>;
}

function CartSummary({ subtotal }: Readonly<{ subtotal: number }>): ReactElement {
  return (
    <aside className="commerceSummary">
      <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
      <div><span>Frete</span><strong>Próxima etapa</strong></div>
      <div className="summaryTotal"><span>Total parcial</span><strong>{formatMoney(subtotal)}</strong></div>
      <Link className="primaryButton" href="/checkout">Continuar para identificação <ArrowRight size={19} weight="bold" /></Link>
      <small>Nenhum valor será cobrado neste protótipo.</small>
    </aside>
  );
}

function CommerceLoading(): ReactElement {
  return <div className="commerceShell commerceLoading" role="status">Preparando seu carrinhoâ€¦</div>;
}

function EmptyCart(): ReactElement {
  return (
    <div className="commerceShell emptyCommerce"><ShoppingCartSimple size={38} weight="duotone" /><span className="eyebrow">Carrinho vazio</span><h1>Seus produtos ainda não entraram aqui.</h1><p>Escolha um item para percorrer a demonstração completa.</p><Link className="primaryButton" href="/loja">Conhecer a loja <ArrowRight size={19} /></Link></div>
  );
}
