"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useCart } from "@/app/commerce/cart-provider";
import { formatMoney, keychainProduct } from "@/app/commerce/catalog";
import { QuantityControl } from "./quantity-control";

export function ProductPurchasePanel(): ReactElement {
  const [quantity, setQuantity] = useState(1);
  const [moving, setMoving] = useState(false);
  const { addProduct } = useCart();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (moving) return;
    setMoving(true);
    addProduct(quantity);
    window.location.assign("/carrinho");
  }

  return (
    <form className="purchasePanel" onSubmit={handleSubmit}>
      <div className="productPrice"><span>Preço demonstrativo</span><strong>{formatMoney(keychainProduct.priceCents)}</strong><small>Valor ilustrativo para validar o fluxo.</small></div>
      <QuantityControl quantity={quantity} onChange={setQuantity} />
      <button className="primaryButton" type="submit" disabled={moving}>{moving ? "Abrindo carrinho…" : "Adicionar e revisar pedido"}<ArrowRight size={20} weight="bold" /></button>
      <p><ShieldCheck size={17} weight="fill" />Mock seguro: nenhuma cobrança, pedido ou envio será criado.</p>
    </form>
  );
}
