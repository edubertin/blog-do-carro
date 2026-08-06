import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("admin local navega, fecha o drawer e não persiste secrets", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Hoje na garagem" })).toBeVisible();

  const openNavigation = page.getByRole("button", { name: "Abrir navegação administrativa" });
  if (await openNavigation.isVisible()) {
    await openNavigation.click();
    await expect(page.getByRole("dialog", { name: "Navegação administrativa" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navegação administrativa" })).toBeHidden();
  }

  await page.goto("/admin/integracoes", { waitUntil: "networkidle" });
  await expect(page.getByText(/não cole senhas, tokens, chaves ou dados reais/i)).toBeVisible();
  const localStorageEntries = await page.evaluate(() => Object.keys(window.localStorage));
  expect(localStorageEntries).toEqual([]);
});

test("admin passa pelo gate de acessibilidade crítico", async ({ page }) => {
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(blocking).toEqual([]);
});

test("servidor local rejeita host externo no mock administrativo", async ({ request }) => {
  const response = await request.get("/admin", { headers: { Host: "blogdocarro.com" } });
  expect([403, 404]).toContain(response.status());
});
