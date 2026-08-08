import { clampQuantity } from "./cart-types";
import type { DemoOrder, DemoOrderLine } from "./checkout-types";
import type { ShippingId } from "./catalog";

const storageKey = "blog-do-carro-demo-order-v1";

type LegacyDemoOrder = Omit<DemoOrder, "items"> & Readonly<{ quantity: number }>;

type ParsedDemoOrder = DemoOrder | LegacyDemoOrder;

export function createDemoOrder(items: readonly DemoOrderLine[], shippingId: ShippingId): DemoOrder {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return {
    version: 1,
    id: `DEMO-CHP-${suffix}`,
    items,
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
    if (!isDemoOrder(parsed) || parsed.id !== id) return null;
    return normalizeDemoOrder(parsed);
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

function normalizeDemoOrder(order: ParsedDemoOrder): DemoOrder {
  if (isDemoOrderWithItems(order)) return order;
  return {
    version: order.version,
    id: order.id,
    items: [{ productId: "chaveiro-blog-do-carro", quantity: clampQuantity(order.quantity, 999) }],
    shippingId: order.shippingId,
    createdAt: order.createdAt,
    status: order.status,
  };
}

function isDemoOrder(order: unknown): order is ParsedDemoOrder {
  if (!order || typeof order !== "object") return false;
  if (!("version" in order) || order.version !== 1) return false;
  if (!("id" in order) || typeof order.id !== "string") return false;
  if (isDemoOrderWithItems(order)) {
    return isDemoOrderStatus(order) && "shippingId" in order && isShippingId(order.shippingId) && "createdAt" in order && typeof order.createdAt === "string";
  }
  return isLegacyDemoOrder(order);
}

function isDemoOrderWithItems(value: unknown): value is DemoOrder {
  return !!(
    value
    && typeof value === "object"
    && "items" in value
    && isDemoOrderItems(value.items)
  );
}

function isLegacyDemoOrder(order: unknown): order is LegacyDemoOrder {
  return (
    !!order
    && typeof order === "object"
    && "quantity" in order
    && typeof order.quantity === "number"
    && Number.isInteger(order.quantity)
    && isDemoOrderStatus(order)
    && "shippingId" in order
    && isShippingId(order.shippingId)
  );
}

function isDemoOrderStatus(value: unknown): value is Pick<DemoOrder, "status" | "createdAt"> {
  return (
    !!value
    && typeof value === "object"
    && "status" in value
    && value.status === "simulation_complete"
    && "createdAt" in value
    && typeof value.createdAt === "string"
  );
}

function isDemoOrderItems(value: unknown): value is readonly DemoOrderLine[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  return value.every((item) => isDemoOrderItem(item));
}

function isDemoOrderItem(value: unknown): value is DemoOrderLine {
  return (
    !!value
    && typeof value === "object"
    && "productId" in value
    && typeof value.productId === "string"
    && "quantity" in value
    && typeof value.quantity === "number"
  );
}

function isShippingId(value: unknown): value is ShippingId {
  return value === "economico" || value === "expresso";
}
