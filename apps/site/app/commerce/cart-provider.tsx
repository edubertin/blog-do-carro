"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { createCartItem, parseCartSnapshot } from "./cart-types";
import type { CartItem, CartSnapshot } from "./cart-types";

const storageKey = "blog-do-carro-cart-v1";

type CartContextValue = Readonly<{
  items: readonly CartItem[];
  itemCount: number;
  ready: boolean;
  addProduct: (quantity: number) => void;
  setQuantity: (quantity: number) => void;
  removeProduct: () => void;
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
    if (ready) writeStoredCart({ version: 1, items });
  }, [items, ready]);

  const replaceItems = useCallback((nextItems: readonly CartItem[]): void => {
    setItems(nextItems);
    if (ready) writeStoredCart({ version: 1, items: nextItems });
  }, [ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    ready,
    addProduct: (quantity) => replaceItems(addQuantity(items, quantity, maximumQuantity)),
    setQuantity: (quantity) => replaceItems([createCartItem(quantity, maximumQuantity)]),
    removeProduct: () => replaceItems([]),
    clearCart: () => replaceItems([]),
  }), [items, maximumQuantity, ready, replaceItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider.");
  return context;
}

function addQuantity(items: readonly CartItem[], quantity: number, maximum: number): CartItem[] {
  const currentQuantity = items[0]?.quantity ?? 0;
  return [createCartItem(currentQuantity + quantity, maximum)];
}

function readStoredCart(): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch (error) {
    console.error("Não foi possível ler o carrinho demonstrativo.", error);
    return null;
  }
}

function writeStoredCart(snapshot: CartSnapshot): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch (error) {
    console.error("Não foi possível salvar o carrinho demonstrativo.", error);
  }
}
