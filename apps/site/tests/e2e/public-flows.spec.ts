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
  const editorialCarousel = page.getByRole("region", { name: "Artigos em destaque" });
  await expect(editorialCarousel.getByRole("link", { name: "Ler artigo", exact: true })).toHaveAttribute("href", /\/artigos\//);
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

test("carrossel editorial navega entre artigos e preserva o destino do CTA", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const carousel = page.getByRole("region", { name: "Artigos em destaque" });
  const dots = carousel.getByRole("button", { name: /^Mostrar artigo / });
  await expect(dots).toHaveCount(4);

  const initialCta = await carousel.getByRole("link", { name: "Ler artigo", exact: true }).getAttribute("href");
  await dots.nth(1).click();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(carousel.getByRole("link", { name: "Ler artigo", exact: true })).not.toHaveAttribute("href", initialCta ?? "");

  await carousel.getByRole("button", { name: "Próximo artigo" }).click();
  await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  await carousel.getByRole("button", { name: "Artigo anterior" }).click();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

  const cta = carousel.getByRole("link", { name: "Ler artigo", exact: true });
  await expect(cta).toHaveCSS("background-color", "rgb(244, 180, 0)");
  const articleHref = await cta.getAttribute("href");
  expect(articleHref).toMatch(/^\/artigos\/[a-z0-9-]+$/);
  await cta.click();
  await expect(page).toHaveURL(new RegExp(`${articleHref}$`));
});

test("carrossel editorial permanece legível nos celulares prioritários", async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "networkidle" });
    const carousel = page.getByRole("region", { name: "Artigos em destaque" });
    await expect(carousel.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(carousel.getByRole("link", { name: "Ler artigo", exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("carrossel continua operável com movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const carousel = page.getByRole("region", { name: "Artigos em destaque" });
  const dots = carousel.getByRole("button", { name: /^Mostrar artigo / });
  await dots.nth(1).click();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(carousel.getByRole("link", { name: "Ler artigo", exact: true })).toBeVisible();
});

test("artigo só carrega o YouTube após consentimento explícito", async ({ page }) => {
  await page.goto("/artigos/moto-por-spin-financiada-bom-negocio", { waitUntil: "networkidle" });
  await expect(page.locator("iframe[src*='youtube']")).toHaveCount(0);
  await page.getByRole("button", { name: /reproduzir vídeo/i }).click();
  await expect(page.locator("iframe[src*='youtube-nocookie.com']")).toHaveCount(1);
});

test("home preserva os produtos e fecha a loja em modo de interesse", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("Navegação editorial")).toHaveCount(0);
  await expect(page.locator("#categorias")).toHaveCount(0);
  const carousel = page.getByRole("region", { name: /loja da comunidade/i });
  await expect(carousel.getByRole("heading", { name: "Chaveiro Blog do Carro" })).toBeVisible();
  await expect(carousel.getByText("R$ 9,90")).toBeVisible();
  await expect(carousel.getByRole("button", { name: /produto anterior/i })).toBeEnabled();
  const nextProduct = carousel.getByRole("button", { name: /próximo produto/i });
  await expect(nextProduct).toBeEnabled();
  const activeProduct = carousel.locator(".homeStoreSlide[aria-hidden='false']");
  await expect(activeProduct.getByText(/preço planejado/i)).toBeVisible();
  await expect(activeProduct.getByText("Avise-me no lançamento")).toBeVisible();
  await expect(carousel.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(0);
  const reloadedCarousel = carousel;
  const reloadedNext = reloadedCarousel.getByRole("button", { name: /próximo produto/i });
  const controlBox = await reloadedNext.boundingBox();
  expect(controlBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(controlBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  await reloadedNext.click();
  const nextActiveProduct = reloadedCarousel.locator(".homeStoreSlide[aria-hidden='false']");
  await expect(nextActiveProduct.getByRole("heading", { name: "Miniatura Blog do Carro" })).toBeVisible();
  await expect(nextActiveProduct.getByText("Produto em desenvolvimento.")).toBeVisible();
  await expect(reloadedCarousel.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(0);
  await expect(reloadedCarousel.getByRole("link")).toHaveCount(0);
});

test("carrinho permanece fechado durante o pré-lançamento", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("blog-do-carro-cart-v2", JSON.stringify({ version: 2, items: [
      { productId: "chaveiro-blog-do-carro", quantity: 1 },
      { productId: "miniatura-blog-do-carro", quantity: 1 },
    ] }));
    window.sessionStorage.setItem("e2e-cart-reset", "done");
  });
  await page.goto("/carrinho", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /vendas ainda não começaram/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /conhecer os produtos/i })).toHaveAttribute("href", "/loja#lista");
});

test("checkout permanece fechado durante o pré-lançamento", async ({ page }) => {
  await page.goto("/checkout", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /vendas ainda não começaram/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /conhecer os produtos/i })).toBeVisible();
});
