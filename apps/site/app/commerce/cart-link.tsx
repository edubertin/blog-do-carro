"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react/ShoppingCartSimple";
import { SiteLink as Link } from "@/app/components/site-link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { useCart } from "./cart-provider";

export function CartLink({ compact = false }: Readonly<{ compact?: boolean }>): ReactElement {
  const pathname = usePathname();
  const { itemCount, ready } = useCart();
  const count = ready ? itemCount : 0;
  const active = pathname === "/carrinho" || pathname.startsWith("/checkout") || pathname.startsWith("/pedido/demo");
  const className = `cartLink${compact ? " cartLinkCompact" : ""}${active ? " active" : ""}`;
  return (
    <Link className={className} href="/carrinho" aria-label={`Abrir carrinho com ${count} ${count === 1 ? "item" : "itens"}`}>
      <ShoppingCartSimple size={compact ? 22 : 21} weight={active ? "fill" : "regular"} aria-hidden="true" />
      <span className={compact ? "srOnly" : ""}>Carrinho</span>
      {count > 0 ? <strong aria-hidden="true">{count}</strong> : null}
    </Link>
  );
}
