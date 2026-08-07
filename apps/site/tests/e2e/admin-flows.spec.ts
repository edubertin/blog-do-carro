import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("admin local navega, fecha o drawer e não persiste secrets no navegador", async ({ page }) => {
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
  await expect(page.getByText(/não use dados reais, senhas ou chaves/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fundação operacional" })).toBeVisible();
  await expect(page.getByText("D1 e R2 ausentes", { exact: true })).toBeVisible();
  await expect(page.getByText("valor oculto", { exact: true })).toHaveCount(0);
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
