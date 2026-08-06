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

export function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(5, Math.trunc(quantity)));
}

export function createCartItem(quantity: number): CartItem {
  return { productId, quantity: clampQuantity(quantity) };
}

export function parseCartSnapshot(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isCartSnapshot(parsed)) return [];
    return parsed.items.map(normalizeItem).filter(isCartItem);
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

function normalizeItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  if (!("productId" in value) || value.productId !== productId) return null;
  if (!("quantity" in value) || typeof value.quantity !== "number") return null;
  return createCartItem(value.quantity);
}

function isCartItem(item: CartItem | null): item is CartItem {
  return item !== null;
}
