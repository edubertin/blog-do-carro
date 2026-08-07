import { clampQuantity } from "./cart-types";
import type { DemoOrder } from "./checkout-types";
import type { ShippingId } from "./catalog";

const storageKey = "blog-do-carro-demo-order-v1";

export function createDemoOrder(quantity: number, maximum: number, shippingId: ShippingId): DemoOrder {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return {
    version: 1,
    id: `DEMO-CHP-${suffix}`,
    quantity: clampQuantity(quantity, maximum),
    shippingId,
    createdAt: new Date().toISOString(),
    status: "simulation_complete",
  };
}

export function saveDemoOrder(order: DemoOrder): void {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(order));
  } catch (error) {
    console.error("Não foi possível salvar a simulação do pedido.", error);
  }
}

export function readDemoOrder(id: string): DemoOrder | null {
  try {
    const value = window.sessionStorage.getItem(storageKey);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return isDemoOrder(parsed) && parsed.id === id ? parsed : null;
  } catch (error) {
    console.error("Não foi possível recuperar a simulação do pedido.", error);
    return null;
  }
}

export function clearDemoOrder(): void {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Não foi possível limpar a simulação do pedido.", error);
  }
}

function isDemoOrder(value: unknown): value is DemoOrder {
  if (!value || typeof value !== "object") return false;
  if (!("version" in value) || value.version !== 1) return false;
  if (!("id" in value) || typeof value.id !== "string") return false;
  if (!("quantity" in value) || typeof value.quantity !== "number") return false;
  if (!("shippingId" in value) || !isShippingId(value.shippingId)) return false;
  if (!("createdAt" in value) || typeof value.createdAt !== "string") return false;
  return "status" in value && value.status === "simulation_complete";
}

function isShippingId(value: unknown): value is ShippingId {
  return value === "economico" || value === "expresso";
}
