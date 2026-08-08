import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const coverAssetId = "11111111-1111-4111-8111-111111111111";
const coverPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function mockCoverUpload(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/api/admin/media", (route) => route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({ asset: { id: coverAssetId, url: `/media/${coverAssetId}`, altText: "Capa editorial do artigo", width: 1200, height: 675 } }),
  }));
  await page.route(`**/api/admin/media/${coverAssetId}`, (route) => route.fulfill({ status: 200, contentType: "image/png", body: coverPng }));
}

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
  await mockCoverUpload(page);
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });

  await expect(page.getByRole("textbox", { name: /Caminho ou URL HTTPS/i })).toHaveCount(0);
  const imageInput = page.locator('[name="imageUrl"]');
  const fileInput = page.getByLabel("Escolher imagem da capa");
  const removeButton = page.getByRole("button", { name: "Remover arquivo" });
  await expect(imageInput).toHaveValue("");
  await expect(removeButton).toBeDisabled();

  await page.getByRole("textbox", { name: "Descrição acessível da imagem" }).fill("Capa editorial do artigo");
  await fileInput.setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: coverPng });
  await expect(imageInput).toHaveValue(`/media/${coverAssetId}`);
  const preview = page.getByRole("img", { name: "Capa editorial do artigo" });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((image) => image instanceof HTMLImageElement ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect(removeButton).toBeEnabled();

  await removeButton.dispatchEvent("click");
  await expect(imageInput).toHaveValue("");
  await expect(removeButton).toBeDisabled();

  await page.getByLabel("Escolher imagem da capa").setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: coverPng });
  await expect(removeButton).toBeEnabled();
});

test("editor insere imagem interna sem depender de diálogo do navegador", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/admin/media", (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Armazenamento temporariamente indisponível." }) })
      : route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ asset: { id: "inline-asset", url: "/media/inline-asset", altText: "Moto preta estacionada em uma garagem", width: 560, height: 350 } }) });
  });
  await page.route("**/api/admin/media/inline-asset", (route) => route.fulfill({ status: 200, contentType: "image/png", body: coverPng }));
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });

  await page.locator(".adminInsertGap").last().getByRole("button", { name: "+ Imagem" }).click();
  const form = page.getByRole("group", { name: "Adicionar imagem interna" });
  await expect(form).toBeVisible();
  const fileInput = form.locator('input[type="file"]');
  await expect(fileInput).toBeDisabled();
  await form.getByRole("textbox", { name: "Descrição acessível" }).fill("Moto preta estacionada em uma garagem");
  await expect(fileInput).toBeEnabled();
  await fileInput.focus();
  await expect(fileInput).toBeFocused();
  await fileInput.setInputFiles({ name: "moto.png", mimeType: "image/png", buffer: coverPng });
  await expect(page.getByRole("alert")).toContainText("Armazenamento temporariamente indisponível.");
  await fileInput.setInputFiles({ name: "moto.png", mimeType: "image/png", buffer: coverPng });

  const preview = page.getByRole("img", { name: "Moto preta estacionada em uma garagem" });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((image) => image instanceof HTMLImageElement ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect(form).toHaveCount(0);
});

test("editor insere imagem no ponto escolhido e preserva a ordem", async ({ page }) => {
  const inlineAssetId = "22222222-2222-4222-8222-222222222222";
  const uploadGate: { release: () => void } = { release: () => undefined };
  const uploadReleased = new Promise<void>((resolve) => { uploadGate.release = resolve; });
  await page.route("**/api/admin/media", async (route) => {
    await uploadReleased;
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ asset: { id: inlineAssetId, url: `/media/${inlineAssetId}`, altText: "Imagem posicionada entre os parágrafos", width: 1200, height: 675 } }) });
  });
  await page.route(`**/api/admin/media/${inlineAssetId}`, (route) => route.fulfill({ status: 200, contentType: "image/png", body: coverPng }));
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });

  const firstParagraph = page.getByRole("textbox", { name: "Parágrafo" }).first();
  await firstParagraph.fill("Primeiro parágrafo do artigo.");
  await page.locator(".adminInsertGap").last().getByRole("button", { name: "+ Texto" }).click();
  await page.getByRole("textbox", { name: "Parágrafo" }).last().fill("Segundo parágrafo do artigo.");

  const middleGap = page.locator(".adminInsertGap").nth(1);
  await middleGap.getByRole("button", { name: "+ Imagem" }).click();
  const imageDraft = middleGap.getByRole("group", { name: "Adicionar imagem interna" });
  await imageDraft.getByRole("textbox", { name: "Descrição acessível" }).fill("Imagem posicionada entre os parágrafos");
  await imageDraft.locator('input[type="file"]').setInputFiles({ name: "entre-paragrafos.png", mimeType: "image/png", buffer: coverPng });

  await expect(page.getByRole("button", { name: /Aguarde o envio da imagem/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Mover bloco para cima" }).first()).toBeDisabled();
  uploadGate.release();

  await expect(page.getByRole("img", { name: "Imagem posicionada entre os parágrafos" })).toBeVisible();
  const bodyJson = await page.locator('[name="bodyJson"]').inputValue();
  const document = JSON.parse(bodyJson) as { blocks: Array<{ type: string; assetId?: string; text?: string }> };
  expect(document.blocks.map((block) => block.type)).toEqual(["paragraph", "image", "paragraph"]);
  expect(document.blocks[0]?.text).toBe("Primeiro parágrafo do artigo.");
  expect(document.blocks[1]?.assetId).toBe(inlineAssetId);
  expect(document.blocks[2]?.text).toBe("Segundo parágrafo do artigo.");
  await expect(page.locator('input[type="file"][aria-label="Substituir imagem interna"]')).toBeAttached();
  await page.locator('input[type="file"][aria-label="Substituir imagem interna"]').focus();
  await expect(page.locator('input[type="file"][aria-label="Substituir imagem interna"]')).toBeFocused();
});

test("editor vazio continua oferecendo pontos de inserção", async ({ page }) => {
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });
  await page.locator(".adminStructuredBlock").getByRole("button", { name: "Remover" }).click();
  await expect(page.locator(".adminStructuredBlock")).toHaveCount(0);
  const emptyGap = page.locator(".adminInsertGap");
  await expect(emptyGap).toHaveCount(1);
  await emptyGap.getByRole("button", { name: "+ Subtítulo" }).click();
  await expect(page.getByRole("textbox", { name: "Subtítulo H2" })).toBeVisible();
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
  await mockCoverUpload(page);
  const requests: string[] = [];
  let refreshAttempts = 0;
  const publishedArticle = { id: "article-flow", revisionId: "revision-1", slug: "artigo-de-teste", title: "Título completo de teste", category: "Negociações", state: "published", version: 2, updatedAt: Date.now(), videoAvailability: "pending" };
  const publishedDraft = { articleId: "article-flow", title: "Título completo de teste", subtitle: "Subtítulo completo para validar o fluxo editorial.", slug: "artigo-de-teste", seoDescription: "Descrição completa para validar busca e compartilhamento do artigo de teste no portal automotivo.", categorySlug: "negociacoes", body: ["Este é um parágrafo completo usado para validar o fluxo editorial do CMS. Ele possui conteúdo suficiente para passar pela validação mínima exigida."], opinion: "Esta é uma opinião editorial completa para o teste.", imageUrl: `/media/${coverAssetId}`, imageAlt: "Carro usado para ilustrar o artigo de teste", youtubeVideoId: "jT0j_rCgbbc", readTimeMinutes: 6, faq: [{ question: "Este fluxo editorial funciona corretamente?", answer: "Sim, o teste percorre todas as etapas obrigatórias." }] };
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
  await page.route("**/api/admin/articles/article-flow", (route) => {
    refreshAttempts += 1;
    return refreshAttempts === 1
      ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Leitura temporariamente indisponível." }) })
      : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ article: publishedArticle, draft: publishedDraft }) });
  });
  await page.goto("/admin/artigos/novo", { waitUntil: "networkidle" });
  await page.locator('[name="youtubeUrl"]').fill("jT0j_rCgbbc");
  await page.locator('[name="title"]').fill("Título completo de teste");
  await page.locator('[name="subtitle"]').fill("Subtítulo completo para validar o fluxo editorial.");
  await page.locator('[name="categorySlug"]').selectOption("negociacoes");
  await page.locator('[name="readTimeMinutes"]').fill("6");
  await page.getByRole("textbox", { name: "Parágrafo" }).fill("Este é um parágrafo completo usado para validar o fluxo editorial do CMS. Ele possui conteúdo suficiente para passar pela validação mínima exigida.");
  await page.locator('[name="imageAlt"]').fill("Carro usado para ilustrar o artigo de teste");
  await page.getByLabel("Escolher imagem da capa").setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: coverPng });
  await page.locator('[name="opinion"]').fill("Esta é uma opinião editorial completa para o teste.");
  await page.locator('[name="faqQuestion"]').fill("Este fluxo editorial funciona corretamente?");
  await page.locator('[name="faqAnswer"]').fill("Sim, o teste percorre todas as etapas obrigatórias.");
  await page.locator('[name="slug"]').fill("artigo-de-teste");
  await page.locator('[name="seoDescription"]').fill("Descrição completa para validar busca e compartilhamento do artigo de teste no portal automotivo.");
  await page.getByRole("button", { name: "Salvar rascunho" }).dispatchEvent("click");
  await expect(page.getByText(/Vídeo adicionado como origem pendente/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar para revisão" })).toBeVisible();
  await page.getByRole("button", { name: "Enviar para revisão" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publicar artigo" }).click();
  await expect.poll(() => refreshAttempts).toBe(2);
  await expect(page.getByRole("button", { name: "Artigo publicado" })).toBeVisible();
  await expect(page).toHaveURL(/article=article-flow/u);
  await page.getByRole("button", { name: "Criar nova revisão" }).dispatchEvent("click");
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Título revisado após publicação");
  await page.getByRole("button", { name: "Salvar rascunho" }).dispatchEvent("click");
  await expect(page.getByRole("button", { name: "Enviar para revisão" })).toBeVisible();
  expect(requests).toEqual(["draft:POST", "review:POST", "publish:POST", "draft:POST"]);
});

test("editar artigo carrega a revisão pelo identificador", async ({ page }) => {
  let attempts = 0;
  const article = { id: "article-test", revisionId: "revision-test", slug: "artigo-existente", title: "Artigo existente no CMS", category: "Negociações", state: "draft", version: 2, updatedAt: Date.now(), videoAvailability: "ready" };
  const draft = { articleId: "article-test", title: article.title, subtitle: "Subtítulo existente suficientemente completo.", slug: article.slug, seoDescription: "Descrição existente suficientemente completa para os resultados de busca do portal.", categorySlug: "negociacoes", body: ["Conteúdo existente do artigo com tamanho suficiente para continuar a edição no painel administrativo sem perder dados."], opinion: "Opinião existente suficientemente completa.", imageUrl: `/media/${coverAssetId}`, imageAlt: "Imagem existente do artigo", youtubeVideoId: "jT0j_rCgbbc", readTimeMinutes: 5, faq: [{ question: "Pergunta existente no artigo?", answer: "Resposta existente no artigo." }] };
  await page.route("**/api/admin/articles/article-test", (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Leitura temporariamente indisponível." }) })
      : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ article, draft }) });
  });
  await page.goto("/admin/artigos/novo?article=article-test", { waitUntil: "networkidle" });
  await expect(page.getByRole("alert")).toContainText("Não foi possível abrir este artigo.");
  await expect(page.getByRole("button", { name: "Salvar rascunho" })).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("textbox", { name: "Título", exact: true })).toHaveValue(article.title);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("textbox", { name: "Título", exact: true })).toHaveValue(article.title);
  await expect(page.locator('[name="slug"]')).toHaveValue(article.slug);
  await expect(page.locator('[name="youtubeUrl"]')).toHaveValue("jT0j_rCgbbc");
});

test("histórico editorial restaura uma versão anterior com confirmação", async ({ page }) => {
  let restored = false;
  const article = (version: number, revisionId: string) => ({ id: "article-history", revisionId, slug: "artigo-historico", title: restored ? "Título restaurado do histórico" : "Título atual do artigo", category: "Negociações", state: "draft", version, updatedAt: Date.now(), videoAvailability: "ready" });
  const draft = () => ({ articleId: "article-history", title: restored ? "Título restaurado do histórico" : "Título atual do artigo", subtitle: "Subtítulo existente suficientemente completo.", slug: "artigo-historico", seoDescription: "Descrição existente suficientemente completa para os resultados de busca do portal.", categorySlug: "negociacoes", body: ["Conteúdo existente do artigo com tamanho suficiente para continuar a edição no painel administrativo sem perder dados."], opinion: "Opinião existente suficientemente completa.", imageUrl: `/media/${coverAssetId}`, imageAlt: "Imagem existente do artigo", youtubeVideoId: "jT0j_rCgbbc", readTimeMinutes: 5, faq: [{ question: "Pergunta existente no artigo?", answer: "Resposta existente no artigo." }] });

  await page.route(/\/api\/admin\/articles\/article-history$/u, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ article: article(restored ? 4 : 3, restored ? "revision-restored" : "revision-current"), draft: draft() }) });
  });
  await page.route("**/api/admin/articles/article-history/revisions", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ revisions: [
      { id: restored ? "revision-restored" : "revision-current", version: restored ? 8 : 7, state: "draft", createdAt: Date.now(), actor: "Editor do Blog" },
      { id: "revision-previous", version: 2, state: "published", createdAt: Date.now() - 60_000, actor: "Carlos Eduardo" },
    ] }) });
  });
  await page.route("**/api/admin/articles/article-history/restore", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ revisionId: "revision-previous", expectedVersion: 3 });
    restored = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ article: article(4, "revision-restored"), draft: draft() }) });
  });

  await page.goto("/admin/artigos/novo?article=article-history", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Versões do artigo" })).toBeVisible();
  await expect(page.getByText("Carlos Eduardo")).toBeVisible();
  await expect(page.locator(".adminRevisionCard--current")).toContainText("Versão 7");
  await expect(page.locator(".adminRevisionCard--current").getByRole("button", { name: "Restaurar esta versão" })).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(accessibility.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  await page.getByRole("button", { name: "Restaurar esta versão" }).dispatchEvent("click");
  await expect(page.getByRole("alertdialog")).toContainText("substituirá imediatamente o conteúdo público atual");
  await page.getByRole("button", { name: "Confirmar restauração" }).dispatchEvent("click");

  await expect(page.getByRole("status")).toContainText("Versão 2 restaurada e publicada");
  await expect(page.getByRole("textbox", { name: "Título", exact: true })).toHaveValue("Título restaurado do histórico");
});

test("histórico editorial permite cancelar sem restaurar", async ({ page }) => {
  const article = { id: "article-cancel", revisionId: "revision-current", slug: "artigo-cancel", title: "Artigo para cancelar restauração", category: "Negociações", state: "draft", version: 2, updatedAt: Date.now(), videoAvailability: "ready" };
  const draft = { articleId: article.id, title: article.title, subtitle: "Subtítulo existente suficientemente completo.", slug: article.slug, seoDescription: "Descrição existente suficientemente completa para os resultados de busca do portal.", categorySlug: "negociacoes", body: ["Conteúdo existente do artigo com tamanho suficiente para continuar a edição no painel administrativo sem perder dados."], opinion: "Opinião existente suficientemente completa.", imageUrl: `/media/${coverAssetId}`, imageAlt: "Imagem existente do artigo", youtubeVideoId: "jT0j_rCgbbc", readTimeMinutes: 5, faq: [{ question: "Pergunta existente no artigo?", answer: "Resposta existente no artigo." }] };
  let restoreRequests = 0;
  await page.route(/\/api\/admin\/articles\/article-cancel$/u, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ article, draft }) }));
  await page.route("**/api/admin/articles/article-cancel/revisions", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ revisions: [{ id: "revision-previous", version: 1, state: "published", createdAt: Date.now(), actor: null }] }) }));
  await page.route("**/api/admin/articles/article-cancel/restore", (route) => { restoreRequests += 1; return route.abort(); });

  await page.goto("/admin/artigos/novo?article=article-cancel", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Restaurar esta versão" }).dispatchEvent("click");
  await page.getByRole("button", { name: "Cancelar" }).dispatchEvent("click");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(restoreRequests).toBe(0);
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
