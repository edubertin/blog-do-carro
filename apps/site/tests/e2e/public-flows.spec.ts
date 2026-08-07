import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
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

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(blocking).toEqual([]);
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

test("mock da loja conclui o pedido sem integração externa", async ({ page }) => {
  await page.goto("/loja/chaveiro-presente", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Adicionar e revisar pedido" }).click();
  await expect(page.getByRole("heading", { name: "Revise seu chaveiro." })).toBeVisible();
  await page.getByRole("link", { name: /Continuar para identificação/i }).click();

  await page.getByLabel("Nome completo").fill("Pessoa de Teste");
  await page.getByLabel("E-mail").fill("teste@example.com");
  await page.getByLabel(/Entendi que esta é uma simulação/i).check();
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await page.getByRole("button", { name: "Preencher endereço fictício" }).click();
  await page.getByRole("button", { name: "Ir para o Pix simulado" }).click();
  await page.getByRole("button", { name: "Revisar pedido" }).click();
  await page.getByLabel(/Entendo que nenhum pedido/i).check();
  await page.getByRole("button", { name: "Concluir simulação" }).click();
  await expect(page.getByRole("heading", { name: "Simulação concluída." })).toBeVisible();
  await expect(page.getByText("Nenhum dado pessoal foi salvo")).toBeVisible();
});
