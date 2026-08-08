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

test("editor permite remover e substituir a imagem antes de salvar", async ({ page }) => {
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });

  const imageInput = page.getByRole("textbox", { name: /Caminho ou URL HTTPS/i });
  const removeButton = page.getByRole("button", { name: "Remover arquivo" });
  await expect(imageInput).toHaveValue("");
  await expect(removeButton).toBeDisabled();

  await imageInput.fill("/images/videos/nova-capa.webp");
  await expect(removeButton).toBeEnabled();

  await removeButton.click();
  await expect(imageInput).toHaveValue("");
  await expect(removeButton).toBeDisabled();

  await imageInput.fill("/images/videos/nova-capa.webp");
  await expect(removeButton).toBeEnabled();
});

test("novo artigo abre vazio e sem checklist lateral", async ({ page }) => {
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });

  await expect(page.getByText("Critérios para publicação")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Título", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Subtítulo", exact: true })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Categoria" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: /Tempo de leitura/i })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: /Endereço do artigo/i })).toHaveValue("");
});

test("artigo percorre rascunho, revisão e publicação", async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/api/admin/articles", async (route) => {
    requests.push(`draft:${route.request().method()}`);
    const article = { id: "article-flow", revisionId: "revision-1", slug: "artigo-de-teste", title: "Título completo de teste", category: "Negociações", state: "draft", version: 1, updatedAt: Date.now(), videoAvailability: "pending" };
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ article }) });
  });
  await page.route("**/api/admin/articles/article-flow/review", async (route) => {
    requests.push(`review:${route.request().method()}`);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/api/admin/articles/article-flow/publish", async (route) => {
    requests.push(`publish:${route.request().method()}`);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });
  await page.locator('[name="youtubeUrl"]').fill("jT0j_rCgbbc");
  await page.locator('[name="title"]').fill("Título completo de teste");
  await page.locator('[name="subtitle"]').fill("Subtítulo completo para validar o fluxo editorial.");
  await page.locator('[name="categorySlug"]').selectOption("negociacoes");
  await page.locator('[name="readTimeMinutes"]').fill("6");
  await page.getByRole("textbox", { name: "Parágrafo" }).fill("Este é um parágrafo completo usado para validar o fluxo editorial do CMS. Ele possui conteúdo suficiente para passar pela validação mínima exigida.");
  await page.locator('[name="imageUrl"]').fill("/images/articles/hero-negociacoes.png");
  await page.locator('[name="imageAlt"]').fill("Carro usado para ilustrar o artigo de teste");
  await page.locator('[name="opinion"]').fill("Esta é uma opinião editorial completa para o teste.");
  await page.locator('[name="faqQuestion"]').fill("Este fluxo editorial funciona corretamente?");
  await page.locator('[name="faqAnswer"]').fill("Sim, o teste percorre todas as etapas obrigatórias.");
  await page.locator('[name="slug"]').fill("artigo-de-teste");
  await page.locator('[name="seoDescription"]').fill("Descrição completa para validar busca e compartilhamento do artigo de teste no portal automotivo.");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByText(/Vídeo adicionado como origem pendente/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar para revisão" })).toBeVisible();
  await page.getByRole("button", { name: "Enviar para revisão" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publicar artigo" }).click();
  await expect(page.getByRole("button", { name: "Artigo publicado" })).toBeVisible();
  expect(requests).toEqual(["draft:POST", "review:POST", "publish:POST"]);
});

test("editar artigo carrega a revisão pelo identificador", async ({ page }) => {
  const article = { id: "article-test", revisionId: "revision-test", slug: "artigo-existente", title: "Artigo existente no CMS", category: "Negociações", state: "draft", version: 2, updatedAt: Date.now(), videoAvailability: "ready" };
  const draft = { articleId: "article-test", title: article.title, subtitle: "Subtítulo existente suficientemente completo.", slug: article.slug, seoDescription: "Descrição existente suficientemente completa para os resultados de busca do portal.", categorySlug: "negociacoes", body: ["Conteúdo existente do artigo com tamanho suficiente para continuar a edição no painel administrativo sem perder dados."], opinion: "Opinião existente suficientemente completa.", imageUrl: "/images/articles/hero-negociacoes.png", imageAlt: "Imagem existente do artigo", youtubeVideoId: "jT0j_rCgbbc", readTimeMinutes: 5, faq: [{ question: "Pergunta existente no artigo?", answer: "Resposta existente no artigo." }] };
  await page.route("**/api/admin/articles/article-test", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ article, draft }) }));
  await page.goto("/admin/artigos/novo?article=article-test", { waitUntil: "networkidle" });
  await expect(page.getByRole("textbox", { name: "Título", exact: true })).toHaveValue(article.title);
  await expect(page.locator('[name="slug"]')).toHaveValue(article.slug);
  await expect(page.locator('[name="youtubeUrl"]')).toHaveValue("jT0j_rCgbbc");
});

test("lista administrativa confirma e remove artigo sem exclusão física", async ({ page }) => {
  let receivedMethod = "";
  await page.route("**/api/admin/articles", async (route) => {
    const article = { id: "article-test", title: "Artigo sintético", category: "Negociações", state: "draft", version: 1, updatedAt: Date.now() };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ articles: [article] }) });
  });
  await page.route(/\/api\/admin\/articles\/[^/]+$/u, async (route) => {
    receivedMethod = route.request().method();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto("/admin/artigos", { waitUntil: "networkidle" });

  const article = page.locator(".adminObjectRow").first();
  await expect(article).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await article.getByRole("button", { name: "Remover artigo" }).click();

  await expect(article).toBeHidden();
  await expect(page.getByRole("status")).toContainText("arquivado");
  expect(receivedMethod).toBe("DELETE");
});
