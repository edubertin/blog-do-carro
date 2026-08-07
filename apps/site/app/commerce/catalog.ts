export const productId = "chaveiro-presente" as const;

export type ProductId = typeof productId;

export type ShippingId = "economico" | "expresso";

export type ShippingOption = Readonly<{
  id: ShippingId;
  name: string;
  estimate: string;
  priceCents: number;
}>;

export const shippingOptions: readonly ShippingOption[] = [
  { id: "economico", name: "Envio econômico", estimate: "6–9 dias úteis", priceCents: 1490 },
  { id: "expresso", name: "Envio expresso", estimate: "3–5 dias úteis", priceCents: 2490 },
];

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoney(valueCents: number): string {
  return moneyFormatter.format(valueCents / 100);
}

export function shippingById(id: ShippingId): ShippingOption {
  return shippingOptions.find((option) => option.id === id) ?? shippingOptions[0];
}
