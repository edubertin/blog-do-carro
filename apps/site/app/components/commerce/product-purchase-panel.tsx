"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useCart } from "@/app/commerce/cart-provider";
import { formatMoney, isPurchasableProductId } from "@/app/commerce/catalog";
import type { CatalogProduct } from "@/db/contracts";
import { QuantityControl } from "./quantity-control";

export function ProductPurchasePanel({ product }: Readonly<{ product: CatalogProduct }>): ReactElement {
  const [quantity, setQuantity] = useState(1);
  const [moving, setMoving] = useState(false);
  const { addProduct } = useCart();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (moving || !isPurchasableProductId(product.slug)) return;
    setMoving(true);
    addProduct(product.slug, quantity);
    window.location.assign("/carrinho");
  }

  return (
    <form className="purchasePanel" onSubmit={handleSubmit}>
      <div className="productPrice"><span>Preço demonstrativo</span><strong>{formatMoney(product.priceCents)}</strong><small>Valor ilustrativo para validar o fluxo.</small></div>
      <QuantityControl quantity={quantity} maximum={product.maxPerCart} onChange={setQuantity} />
      <button className="primaryButton" type="submit" disabled={moving}>{moving ? "Abrindo carrinho…" : "Adicionar e revisar pedido"}<ArrowRight size={20} weight="bold" /></button>
      <p><ShieldCheck size={17} weight="fill" />Mock seguro: nenhuma cobrança, pedido ou envio será criado.</p>
    </form>
  );
}
