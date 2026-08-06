import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport + 1);
}

async function expectNoBlockingA11yIssues(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(blocking).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/(i\.ytimg\.com|www\.youtube-nocookie\.com)\/.*/, async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
});

test("home mantém navegação confortável e sem overflow", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Loja da comunidade", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu principal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menu principal" })).toBeHidden();
});

test("artigo só carrega o player do YouTube após escolha explícita", async ({ page }) => {
  await page.goto("/artigos/moto-por-spin-financiada-bom-negocio", { waitUntil: "networkidle" });
  await expect(page.locator("iframe[src*='youtube']")).toHaveCount(0);
  await expectNoBlockingA11yIssues(page);
  await page.getByRole("button", { name: /reproduzir vídeo/i }).click();
  await expect(page.locator("iframe[src*='youtube-nocookie.com']")).toHaveCount(1);
});

test("loja percorre produto, carrinho e checkout sem cobrança real", async ({ page }) => {
  await page.goto("/loja/chaveiro-presente", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /adicionar e revisar pedido/i }).click();
  await expect(page.getByRole("heading", { name: /revise seu chaveiro/i })).toBeVisible();
  await page.getByRole("link", { name: /continuar para identificação/i }).click();
  await expect(page.getByRole("heading", { name: /quem está comprando/i })).toBeVisible();
  await expect(page.getByText(/nenhuma compra, cobrança, etiqueta ou entrega/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
