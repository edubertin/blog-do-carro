import { isPurchasableProductId } from "./catalog";
import type { PurchasableProductId } from "./catalog";

const legacyProductId = "chaveiro-presente";
const migratedProductId: PurchasableProductId = "chaveiro-blog-do-carro";

export type CartItem = Readonly<{
  productId: PurchasableProductId;
  quantity: number;
}>;

export type CartSnapshot = Readonly<{
  version: 2;
  items: readonly CartItem[];
}>;

export function clampQuantity(quantity: number, maximum: number): number {
  const safeMaximum = Number.isInteger(maximum) && maximum > 0 ? maximum : 1;
  return Math.max(1, Math.min(safeMaximum, Math.trunc(quantity)));
}

export function createCartItem(productId: PurchasableProductId, quantity: number, maximum: number): CartItem {
  return { productId, quantity: clampQuantity(quantity, maximum) };
}

export function parseCartSnapshot(value: string | null, maximum: number): CartItem[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    const items = snapshotItems(parsed).map((item) => normalizeItem(item, maximum)).filter(isCartItem);
    return deduplicateItems(items);
  } catch (error) {
    console.error("Não foi possível recuperar o carrinho demonstrativo.", error);
    return [];
  }
}

function snapshotItems(value: unknown): readonly unknown[] {
  if (!value || typeof value !== "object" || !("items" in value) || !Array.isArray(value.items)) return [];
  if (!("version" in value) || (value.version !== 1 && value.version !== 2)) return [];
  return value.items;
}

function normalizeItem(value: unknown, maximum: number): CartItem | null {
  if (!value || typeof value !== "object") return null;
  if (!("productId" in value) || !("quantity" in value) || typeof value.quantity !== "number") return null;
  const productId = normalizeProductId(value.productId);
  return productId ? createCartItem(productId, value.quantity, maximum) : null;
}

function normalizeProductId(value: unknown): PurchasableProductId | null {
  if (value === legacyProductId) return migratedProductId;
  return isPurchasableProductId(value) ? value : null;
}

function isCartItem(item: CartItem | null): item is CartItem {
  return item !== null;
}

function deduplicateItems(items: readonly CartItem[]): CartItem[] {
  return items.reduce<CartItem[]>((unique, item) => {
    if (unique.some((candidate) => candidate.productId === item.productId)) return unique;
    return [...unique, item];
  }, []);
}
