import type { ProductId, ShippingId } from "./catalog";

export type CheckoutStep = "identity" | "delivery" | "payment" | "review";

export type BuyerDetails = Readonly<{
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}>;

export type AddressDetails = Readonly<{
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}>;

export const initialBuyer: BuyerDetails = {
  name: "",
  email: "",
  phone: "",
  consent: false,
};

export const initialAddress: AddressDetails = {
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export type DemoOrder = Readonly<{
  version: 1;
  id: string;
  items: readonly DemoOrderLine[];
  shippingId: ShippingId;
  createdAt: string;
  status: "simulation_complete";
}>;

export type DemoOrderLine = Readonly<{
  productId: ProductId;
  quantity: number;
}>;
