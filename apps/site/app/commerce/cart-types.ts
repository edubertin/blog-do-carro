import { productId } from "./catalog";
import type { ProductId } from "./catalog";

export type CartItem = Readonly<{
  productId: ProductId;
  quantity: number;
}>;

export type CartSnapshot = Readonly<{
  version: 1;
  items: readonly CartItem[];
}>;

export function clampQuantity(quantity: number, maximum: number): number {
  const safeMaximum = Number.isInteger(maximum) && maximum > 0 ? maximum : 1;
  return Math.max(1, Math.min(safeMaximum, Math.trunc(quantity)));
}

export function createCartItem(quantity: number, maximum: number): CartItem {
  return { productId, quantity: clampQuantity(quantity, maximum) };
}

export function parseCartSnapshot(value: string | null, maximum: number): CartItem[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isCartSnapshot(parsed)) return [];
    return parsed.items.map((item) => normalizeItem(item, maximum)).filter(isCartItem);
  } catch (error) {
    console.error("Não foi possível recuperar o carrinho demonstrativo.", error);
    return [];
  }
}

function isCartSnapshot(value: unknown): value is CartSnapshot {
  if (!value || typeof value !== "object") return false;
  if (!("version" in value) || value.version !== 1) return false;
  return "items" in value && Array.isArray(value.items);
}

function normalizeItem(value: unknown, maximum: number): CartItem | null {
  if (!value || typeof value !== "object") return null;
  if (!("productId" in value) || value.productId !== productId) return null;
  if (!("quantity" in value) || typeof value.quantity !== "number") return null;
  return createCartItem(value.quantity, maximum);
}

function isCartItem(item: CartItem | null): item is CartItem {
  return item !== null;
}
