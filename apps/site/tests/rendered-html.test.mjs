import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

const htmlRoutes = [
  ["/", /Loja da comunidade/i],
  ["/artigos/moto-por-spin-financiada-bom-negocio", /Minha opinião/i],
  ["/categoria/negociacoes", /Conteúdo direto/i],
  ["/categoria/sedan", /Garagem em preparação/i],
  ["/loja", /Coleção Presença/i],
  ["/loja/chaveiro-presente", /Compra simulada/i],
  ["/carrinho", /Preparando seu carrinho/i],
  ["/checkout", /Checkout demonstrativo/i],
  ["/sobre", /Informação com contexto/i],
  ["/contato", /Contato editorial/i],
  ["/marketplace", /Em preparação/i],
  ["/privacidade", /Dados locais do mock/i],
  ["/termos", /Escopo atual/i],
];

async function fetchRoute(worker, path, customEnvironment = environment) {
  return worker.fetch(new Request(`http://localhost${path}`), customEnvironment, context);
}

test("server-renders the public route matrix", async (contextTest) => {
  const worker = await loadWorker();
  for (const [path, expectedContent] of htmlRoutes) {
    await contextTest.test(path, async () => {
      const response = await fetchRoute(worker, path);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
      assert.match(html, expectedContent);
    });
  }
});

test("serves crawler metadata", async () => {
  const worker = await loadWorker();
  const robots = await fetchRoute(worker, "/robots.txt");
  const sitemap = await fetchRoute(worker, "/sitemap.xml");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/blogdocarro\.com\/sitemap\.xml/i);
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /<loc>https:\/\/blogdocarro\.com<\/loc>/i);
});

test("renders canonical, robots and structured article metadata", async () => {
  const worker = await loadWorker();
  const article = await fetchRoute(worker, "/artigos/moto-por-spin-financiada-bom-negocio");
  const checkout = await fetchRoute(worker, "/checkout");
  const articleHtml = await article.text();
  const checkoutHtml = await checkout.text();
  assert.match(articleHtml, /rel="canonical" href="https:\/\/blogdocarro\.com\/artigos\/moto-por-spin-financiada-bom-negocio"/i);
  assert.match(articleHtml, /"@type":"FAQPage"/i);
  assert.match(checkoutHtml, /name="robots" content="noindex, nofollow"/i);
});

test("handles both image optimization route conventions", async () => {
  const worker = await loadWorker();
  const imageEnvironment = {
    ASSETS: { fetch: async () => new Response("image", { headers: { "content-type": "image/png" } }) },
  };
  for (const imagePath of ["/_next/image", "/_vinext/image"]) {
    const query = "?url=%2Fimages%2Fproducts%2Fchaveiro-presente.png&w=640&q=75";
    const response = await fetchRoute(worker, `${imagePath}${query}`, imageEnvironment);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
  }
});

test("returns not found for an unknown route", async () => {
  const worker = await loadWorker();
  const response = await fetchRoute(worker, "/rota-inexistente");
  assert.equal(response.status, 404);
});
