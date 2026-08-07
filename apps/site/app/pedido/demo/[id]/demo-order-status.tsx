"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { LockKey } from "@phosphor-icons/react/LockKey";
import { Package } from "@phosphor-icons/react/Package";
import { SiteLink as Link } from "@/app/components/site-link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactElement, RefObject } from "react";
import { formatMoney, shippingById } from "@/app/commerce/catalog";
import type { DemoOrder } from "@/app/commerce/checkout-types";
import { clearDemoOrder, readDemoOrder } from "@/app/commerce/demo-order-storage";
import type { CatalogProduct } from "@/db/contracts";

export function DemoOrderStatus({ orderId, product }: Readonly<{ orderId: string; product: CatalogProduct }>): ReactElement {
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);
  const headingRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => setOrder(readDemoOrder(orderId)), 0);
    return () => window.clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    if (order) headingRef.current?.focus();
  }, [order]);

  function restart(): void {
    clearDemoOrder();
    router.push("/loja/chaveiro-presente");
  }

  if (order === undefined) return <div className="commerceShell commerceLoading" role="status">Recuperando sua simulação…</div>;
  if (!order) return <MissingDemoOrder />;
  return <CompletedDemoOrder order={order} product={product} headingRef={headingRef} onRestart={restart} />;
}

type CompletedProps = Readonly<{
  order: DemoOrder;
  product: CatalogProduct;
  headingRef: RefObject<HTMLDivElement | null>;
  onRestart: () => void;
}>;

function CompletedDemoOrder({ order, product, headingRef, onRestart }: CompletedProps): ReactElement {
  const shipping = shippingById(order.shippingId);
  const subtotal = product.priceCents * order.quantity;
  const total = subtotal + shipping.priceCents;
  return (
    <div className="commerceShell confirmationShell">
      <section className="confirmationHero" ref={headingRef} tabIndex={-1} role="status" aria-live="polite"><CheckCircle size={54} weight="fill" /><span className="eyebrow">Presença confirmada</span><h1>Simulação concluída.</h1><p>Nenhuma cobrança ou entrega foi criada.</p><code>{order.id}</code></section>
      <div className="confirmationGrid"><section className="confirmationCard"><Package size={23} weight="duotone" /><div><span>Resumo demonstrativo</span><strong>{order.quantity}× {product.name}</strong><small>{shipping.name} · {shipping.estimate}</small></div><b>{formatMoney(total)}</b></section><section className="confirmationCard"><LockKey size={23} weight="duotone" /><div><span>Privacidade</span><strong>Nenhum dado pessoal foi salvo</strong><small>A referência funciona somente nesta aba do navegador.</small></div></section></div>
      <div className="confirmationActions"><Link className="primaryButton" href="/loja">Voltar à loja <ArrowRight size={19} /></Link><button className="secondaryAction" type="button" onClick={onRestart}>Recomeçar demonstração</button></div>
    </div>
  );
}

function MissingDemoOrder(): ReactElement {
  return <div className="commerceShell emptyCommerce"><span className="eyebrow">Referência indisponível</span><h1>Esta simulação não existe nesta aba.</h1><p>Ela pode ter expirado ou sido aberta em outro navegador.</p><Link className="primaryButton" href="/loja/chaveiro-presente">Recomeçar no produto <ArrowRight size={19} /></Link></div>;
}
