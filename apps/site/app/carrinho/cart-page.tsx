"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ShoppingCartSimple } from "@phosphor-icons/react/ShoppingCartSimple";
import { Trash } from "@phosphor-icons/react/Trash";
import Image from "next/image";
import { SiteLink as Link } from "@/app/components/site-link";
import type { ReactElement } from "react";
import { useCart } from "@/app/commerce/cart-provider";
import { formatMoney, keychainProduct } from "@/app/commerce/catalog";
import { QuantityControl } from "@/app/components/commerce/quantity-control";

export function CartPage(): ReactElement {
  const { items, ready, setQuantity, removeProduct } = useCart();
  const item = items[0];
  if (!ready) return <CommerceLoading />;
  if (!item) return <EmptyCart />;
  const subtotal = keychainProduct.priceCents * item.quantity;
  return (
    <div className="commerceShell cartShell">
      <CommerceHeader eyebrow="Compra simulada · 01" title="Revise seu chaveiro." description="A próxima etapa coleta dados somente na memória desta página." />
      <div className="cartLayout">
        <section className="cartList" aria-label="Itens do carrinho">
          <article className="cartLine">
            <div className="cartImage"><Image src={keychainProduct.image} alt="Chaveiro Presente" fill sizes="120px" /></div>
            <div className="cartCopy"><span>{keychainProduct.collection}</span><h2>{keychainProduct.name}</h2><strong>{formatMoney(keychainProduct.priceCents)} cada</strong><button type="button" onClick={removeProduct}><Trash size={16} />Remover</button></div>
            <QuantityControl quantity={item.quantity} onChange={setQuantity} />
            <b className="cartLineTotal">{formatMoney(subtotal)}</b>
          </article>
          <Link className="textAction" href="/loja/chaveiro-presente">← Voltar ao produto</Link>
        </section>
        <CartSummary subtotal={subtotal} />
      </div>
    </div>
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
  return <div className="commerceShell commerceLoading" role="status">Preparando seu carrinho…</div>;
}

function EmptyCart(): ReactElement {
  return (
    <div className="commerceShell emptyCommerce"><ShoppingCartSimple size={38} weight="duotone" /><span className="eyebrow">Carrinho vazio</span><h1>Seu chaveiro ainda não entrou aqui.</h1><p>Adicione o produto para percorrer a demonstração completa.</p><Link className="primaryButton" href="/loja/chaveiro-presente">Conhecer o chaveiro <ArrowRight size={19} /></Link></div>
  );
}
