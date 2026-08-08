"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { createCartItem, parseCartSnapshot } from "./cart-types";
import type { CartItem, CartSnapshot } from "./cart-types";
import type { PurchasableProductId } from "./catalog";

const storageKey = "blog-do-carro-cart-v2";
const legacyStorageKey = "blog-do-carro-cart-v1";

type CartContextValue = Readonly<{
  items: readonly CartItem[];
  itemCount: number;
  ready: boolean;
  addProduct: (productId: PurchasableProductId, quantity: number) => void;
  setQuantity: (productId: PurchasableProductId, quantity: number) => void;
  removeProduct: (productId: PurchasableProductId) => void;
  clearCart: () => void;
}>;

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = Readonly<{ children: ReactNode; maximumQuantity: number }>;

export function CartProvider({ children, maximumQuantity }: CartProviderProps): ReactElement {
  const [items, setItems] = useState<readonly CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(parseCartSnapshot(readStoredCart(), maximumQuantity));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [maximumQuantity]);

  useEffect(() => {
    if (ready) writeStoredCart({ version: 2, items });
  }, [items, ready]);

  const replaceItems = useCallback((nextItems: readonly CartItem[]): void => {
    setItems(nextItems);
    if (ready) writeStoredCart({ version: 2, items: nextItems });
  }, [ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    ready,
    addProduct: (id, quantity) => replaceItems(addQuantity(items, id, quantity, maximumQuantity)),
    setQuantity: (id, quantity) => replaceItems(changeQuantity(items, id, quantity, maximumQuantity)),
    removeProduct: (id) => replaceItems(items.filter((item) => item.productId !== id)),
    clearCart: () => replaceItems([]),
  }), [items, maximumQuantity, ready, replaceItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider.");
  return context;
}

function addQuantity(items: readonly CartItem[], id: PurchasableProductId, quantity: number, maximum: number): CartItem[] {
  const current = items.find((item) => item.productId === id)?.quantity ?? 0;
  return upsertItem(items, createCartItem(id, current + quantity, maximum));
}

function changeQuantity(items: readonly CartItem[], id: PurchasableProductId, quantity: number, maximum: number): CartItem[] {
  return upsertItem(items, createCartItem(id, quantity, maximum));
}

function upsertItem(items: readonly CartItem[], replacement: CartItem): CartItem[] {
  const exists = items.some((item) => item.productId === replacement.productId);
  if (!exists) return [...items, replacement];
  return items.map((item) => item.productId === replacement.productId ? replacement : item);
}

function readStoredCart(): string | null {
  try {
    return window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
  } catch (error) {
    console.error("Não foi possível ler o carrinho demonstrativo.", error);
    return null;
  }
}

function writeStoredCart(snapshot: CartSnapshot): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    window.localStorage.removeItem(legacyStorageKey);
  } catch (error) {
    console.error("Não foi possível salvar o carrinho demonstrativo.", error);
  }
}
