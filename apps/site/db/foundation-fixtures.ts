import type { FoundationRepositorySeed } from "./contracts";

export const foundationRepositorySeed = {
  articles: [],
  categories: [],
  categoryGroups: [],
  featuredVideos: [],
  navigationItems: [],
  products: [
    {
      id: "prd_chaveiro_presente",
      variantId: "var_chp_demo_ed01",
      slug: "chaveiro-presente",
      sku: "CHP-DEMO-01",
      name: "Chaveiro Presente",
      collectionName: "Coleção Presença · Edição 01",
      description: "Para quem chega cedo, comenta “presente” e faz parte da nossa garagem.",
      imageUrl: "/images/products/chaveiro-presente.png",
      imageAlt: "Chaveiro Blog do Carro com personagem dizendo Presente",
      status: "preview",
      currency: "BRL",
      priceCents: 2_990,
      priceKind: "illustrative",
      maxPerCart: 5,
      inventoryMode: "untracked",
    },
  ],
} satisfies FoundationRepositorySeed;
