import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("e2e-cart-reset") === "done") return;
    window.localStorage.clear();
    window.sessionStorage.setItem("e2e-cart-reset", "done");
  });
  await page.route(/https:\/\/(i\.ytimg\.com|www\.youtube-nocookie\.com)\/.*/, async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
});

test("portal público funciona sem overflow e busca sem exigir acentos", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const firstDot = page.getByRole("button", { name: /^Mostrar / }).first();
  const dotBox = await firstDot.boundingBox();
  expect(dotBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(dotBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  await page.getByRole("button", { name: "Abrir busca" }).click();
  await page.getByPlaceholder("Digite modelo, categoria ou assunto").fill("negociacoes");
  await expect(page.getByRole("link", { name: /Trocar uma moto por uma Spin/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu principal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menu principal" })).toBeHidden();
});

test("artigo só carrega o YouTube após consentimento explícito", async ({ page }) => {
  await page.goto("/artigos/moto-por-spin-financiada-bom-negocio", { waitUntil: "networkidle" });
  await expect(page.locator("iframe[src*='youtube']")).toHaveCount(0);
  await page.getByRole("button", { name: /reproduzir vídeo/i }).click();
  await expect(page.locator("iframe[src*='youtube-nocookie.com']")).toHaveCount(1);
});

test("home simplifica a loja e mantém apenas o chaveiro disponível", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("Navegação editorial")).toHaveCount(0);
  await expect(page.locator("#categorias")).toHaveCount(0);
  const carousel = page.getByRole("region", { name: /loja da comunidade/i });
  await expect(carousel.getByRole("heading", { name: "Chaveiro Blog do Carro" })).toBeVisible();
  await expect(carousel.getByText("R$ 9,90")).toBeVisible();
  await expect(carousel.getByRole("button", { name: /produto anterior/i })).toBeEnabled();
  const nextProduct = carousel.getByRole("button", { name: /próximo produto/i });
  await expect(nextProduct).toBeEnabled();
  await carousel.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.waitForURL("/carrinho");
  await expect(page.getByRole("heading", { name: "Chaveiro Blog do Carro" })).toBeVisible();
  await page.goto("/");
  const reloadedCarousel = page.getByRole("region", { name: /loja da comunidade/i });
  const reloadedNext = reloadedCarousel.getByRole("button", { name: /próximo produto/i });
  const controlBox = await reloadedNext.boundingBox();
  expect(controlBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(controlBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  await reloadedNext.click();
  await expect(reloadedCarousel.getByRole("heading", { name: "Miniatura Blog do Carro" })).toBeVisible();
  await expect(reloadedCarousel.getByText("Em breve", { exact: true })).toBeVisible();
  await expect(reloadedCarousel.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(0);
  await expect(reloadedCarousel.getByRole("link")).toHaveCount(0);
});

test("carrinho descarta produto em breve mesmo em snapshot adulterado", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("blog-do-carro-cart-v2", JSON.stringify({ version: 2, items: [
      { productId: "chaveiro-blog-do-carro", quantity: 1 },
      { productId: "miniatura-blog-do-carro", quantity: 1 },
    ] }));
    window.sessionStorage.setItem("e2e-cart-reset", "done");
  });
  await page.goto("/carrinho", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Chaveiro Blog do Carro" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Miniatura Blog do Carro" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /abrir carrinho com 1 item/i })).toBeVisible();
});

test("carrinho persiste e remove o chaveiro", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const carousel = page.getByRole("region", { name: /loja da comunidade/i });
  await carousel.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.waitForURL("/carrinho");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Chaveiro Blog do Carro" })).toBeVisible();
  const chaveiroLine = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Chaveiro Blog do Carro" }) });
  await chaveiroLine.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByRole("heading", { name: "Chaveiro Blog do Carro" })).toHaveCount(0);
  await expect(page.getByText(/carrinho vazio/i)).toBeVisible();
});
