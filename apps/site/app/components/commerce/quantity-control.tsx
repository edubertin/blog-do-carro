"use client";

import { Minus } from "@phosphor-icons/react/Minus";
import { Plus } from "@phosphor-icons/react/Plus";
import type { ReactElement } from "react";
import { clampQuantity } from "@/app/commerce/cart-types";

type QuantityControlProps = Readonly<{
  quantity: number;
  onChange: (quantity: number) => void;
  label?: string;
}>;

export function QuantityControl({ quantity, onChange, label = "Quantidade" }: QuantityControlProps): ReactElement {
  return (
    <div className="quantityControl">
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onChange(clampQuantity(quantity - 1))} disabled={quantity <= 1} aria-label="Diminuir quantidade"><Minus size={17} weight="bold" /></button>
        <output aria-live="polite" aria-label={`${quantity} unidades`}>{quantity}</output>
        <button type="button" onClick={() => onChange(clampQuantity(quantity + 1))} disabled={quantity >= 5} aria-label="Aumentar quantidade"><Plus size={17} weight="bold" /></button>
      </div>
    </div>
  );
}
