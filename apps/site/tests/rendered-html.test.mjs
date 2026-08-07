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

const draftArticleSlug = "rascunho-editorial-nao-publicado";

function editorialFixture(status, slug) {
  return {
    status,
    slug,
    category: "Sedan",
    title: status === "published" ? "Artigo público de teste" : "Rascunho editorial de teste",
    subtitle: "Fixture usada somente para validar a projeção editorial.",
    dateLabel: "PENDENTE",
    readTime: "1 MIN",
    image: "/images/articles/hero-negociacoes.png",
    imageAlt: "Imagem de teste",
    body: ["Conteúdo de teste."],
    opinion: "Opinião de teste.",
    faq: [{ question: "Pergunta de teste?", answer: "Resposta de teste." }],
  };
}

async function loadTypescriptModule(relativePath) {
  const [{ readFile }, typescriptModule] = await Promise.all([
    import("node:fs/promises"),
    import("typescript"),
  ]);
  const sourceUrl = new URL(relativePath, import.meta.url);
  const source = await readFile(sourceUrl, "utf8");
  const output = typescriptModule.default.transpileModule(source, {
    compilerOptions: {
      module: typescriptModule.default.ModuleKind.ESNext,
      target: typescriptModule.default.ScriptTarget.ES2022,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  return import(moduleUrl);
}

async function loadContentModule() {
  return loadTypescriptModule("../app/lib/content.ts");
}

async function loadAdminAuthCore() {
  return loadTypescriptModule("../app/admin/admin-auth-core.ts");
}

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
  ["/admin", /Hoje na garagem/i],
  ["/admin/analytics", /Sinais, não vaidade/i],
  ["/admin/artigos", /A pauta nasce do vídeo/i],
  ["/admin/artigos/novo", /Novo artigo/i],
  ["/admin/home", /Composição da home/i],
  ["/admin/menu", /Menu e categorias/i],
  ["/admin/loja/produtos", /Produtos/i],
  ["/admin/loja/configuracoes", /Configurações/i],
  ["/admin/pedidos", /Pedidos demonstrativos/i],
  ["/admin/integracoes", /Control plane/i],
  ["/admin/seguranca", /Acesso e auditoria/i],
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
  const robotsText = await robots.text();
  assert.match(robotsText, /Sitemap: https:\/\/blogdocarro\.com\/sitemap\.xml/i);
  assert.match(robotsText, /Disallow: \/admin\//i);
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /<loc>https:\/\/blogdocarro\.com<\/loc>/i);
  assert.match(sitemapText, /<loc>https:\/\/blogdocarro\.com\/privacidade<\/loc>/i);
  assert.match(sitemapText, /<loc>https:\/\/blogdocarro\.com\/termos<\/loc>/i);
  assert.doesNotMatch(sitemapText, new RegExp(draftArticleSlug, "i"));
});

test("exposes the approved BDC icon and future PWA manifest metadata", async () => {
  const worker = await loadWorker();
  const home = await fetchRoute(worker, "/");
  const html = await home.text();
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/i);
  assert.match(html, /rel="icon"[^>]+blog-do-carro-icon\.png/i);
  assert.match(html, /rel="apple-touch-icon"[^>]+blog-do-carro-icon\.png/i);
  assert.match(html, /name="theme-color" content="#0D0D0D"/i);
});

test("projects only published editorial records", async () => {
  const { findPublishedArticleIn, selectPublishedArticles } = await loadContentModule();
  const records = [
    editorialFixture("published", "artigo-publicado-de-teste"),
    editorialFixture("draft", draftArticleSlug),
  ];
  const projected = selectPublishedArticles(records);
  assert.deepEqual(projected.map((article) => article.slug), ["artigo-publicado-de-teste"]);
  assert.equal(findPublishedArticleIn(records, draftArticleSlug), undefined);
});

test("does not resolve an unpublished article route", async () => {
  const worker = await loadWorker();
  const [draftRoute, home, emptyCategory] = await Promise.all([
    fetchRoute(worker, `/artigos/${draftArticleSlug}`),
    fetchRoute(worker, "/"),
    fetchRoute(worker, "/categoria/sedan"),
  ]);
  assert.equal(draftRoute.status, 404);
  assert.doesNotMatch(await home.text(), new RegExp(draftArticleSlug, "i"));
  const categoryHtml = await emptyCategory.text();
  assert.match(categoryHtml, /Garagem em preparação/i);
  assert.doesNotMatch(categoryHtml, new RegExp(draftArticleSlug, "i"));
});

test("keeps the administrative mock local and non-cacheable", async () => {
  const worker = await loadWorker();
  const localAdmin = await fetchRoute(worker, "/admin/integracoes");
  const localHtml = await localAdmin.text();
  assert.equal(localAdmin.status, 200);
  assert.equal(localAdmin.headers.get("cache-control"), "private, no-store");
  assert.equal(localAdmin.headers.get("content-security-policy"), "frame-ancestors 'none'");
  assert.equal(localAdmin.headers.get("permissions-policy"), "camera=(), geolocation=(), microphone=()");
  assert.equal(localAdmin.headers.get("referrer-policy"), "no-referrer");
  assert.equal(localAdmin.headers.get("x-content-type-options"), "nosniff");
  assert.equal(localAdmin.headers.get("x-frame-options"), "DENY");
  assert.match(localHtml, /name="robots" content="noindex, nofollow/i);
  assert.match(localHtml, /Não cole senhas, tokens, chaves ou dados reais/i);
  assert.match(localHtml, /Prévia local/i);
});

test("gates the hosted admin through SIWC and a server-side owner bootstrap", async () => {
  const worker = await loadWorker();
  const configuredEnvironment = { ...environment, ADMIN_OWNER_USER_IDS: '["owner-alpha"]' };
  const anonymous = await worker.fetch(
    new Request("https://blogdocarro.com/admin/artigos?status=draft", {
      headers: { "x-blog-do-carro-admin-authorized": "owner" },
    }),
    configuredEnvironment,
    context,
  );
  assert.equal(anonymous.status, 307);
  assert.equal(
    anonymous.headers.get("location"),
    "https://blogdocarro.com/signin-with-chatgpt?return_to=%2Fadmin%2Fartigos%3Fstatus%3Ddraft",
  );
  assert.equal(anonymous.headers.get("cache-control"), "private, no-store");

  const misconfigured = await worker.fetch(
    new Request("https://blogdocarro.com/admin"),
    environment,
    context,
  );
  assert.equal(misconfigured.status, 503);

  const denied = await worker.fetch(new Request("https://blogdocarro.com/admin", {
    headers: { "oai-authenticated-user-id": "unknown-owner" },
  }), configuredEnvironment, context);
  assert.equal(denied.status, 403);

  const allowed = await worker.fetch(new Request("https://blogdocarro.com/admin", {
    headers: {
      "oai-authenticated-user-id": "owner-alpha",
      "oai-authenticated-user-full-name": "Owner%20de%20Teste",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
  }), configuredEnvironment, context);
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /Sessão SIWC protegida/i);

  const securityPage = await worker.fetch(new Request("https://blogdocarro.com/admin/seguranca", {
    headers: {
      "oai-authenticated-user-id": "owner-alpha",
      "oai-authenticated-user-full-name": "Owner%20de%20Teste",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
  }), configuredEnvironment, context);
  assert.equal(securityPage.status, 200);
  const securityHtml = await securityPage.text();
  assert.match(securityHtml, /ID estável do Sites/i);
  assert.match(securityHtml, /owner-alpha/i);

  const apiAnonymous = await worker.fetch(
    new Request("https://blogdocarro.com/api/admin/orders"),
    configuredEnvironment,
    context,
  );
  assert.equal(apiAnonymous.status, 401);
});

test("authorizes admin owners by stable Sites user ID", async () => {
  const { resolveAdminAccess } = await loadAdminAuthCore();
  const bootstrap = { userIds: JSON.stringify(["owner-alpha", "owner-beta"]) };
  const allowedHeaders = new Headers({
    "oai-authenticated-user-id": "owner-beta",
    "oai-authenticated-user-full-name": "Pessoa%20Autorizada",
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  });
  const allowed = resolveAdminAccess(allowedHeaders, "blogdocarro.com", bootstrap);
  assert.equal(allowed.kind, "allowed");
  assert.equal(allowed.identity.actorId, "owner-beta");
  assert.equal(allowed.identity.displayName, "Pessoa Autorizada");
  assert.equal(allowed.identity.localPreview, false);

  const denied = resolveAdminAccess(
    new Headers({ "oai-authenticated-user-id": "unknown-owner" }),
    "blogdocarro.com",
    bootstrap,
  );
  assert.equal(denied.kind, "denied");
});

test("supports the temporary normalized owner email bootstrap without exposing it as actor ID", async () => {
  const { resolveAdminAccess } = await loadAdminAuthCore();
  const access = resolveAdminAccess(
    new Headers({
      "oai-authenticated-user-id": "stable-sites-subject",
      "oai-authenticated-user-email": "  OWNER@EXAMPLE.COM ",
    }),
    "blogdocarro.com",
    { emailAllowlist: "Owner@Example.com", emailBootstrapEnabled: true },
  );
  assert.equal(access.kind, "allowed");
  assert.equal(access.identity.actorId, "stable-sites-subject");
  assert.equal(access.identity.displayName, "Administrador");
});

test("fails closed when owner bootstrap or stable Sites identity is absent", async () => {
  const { resolveAdminAccess } = await loadAdminAuthCore();
  const identity = new Headers({ "oai-authenticated-user-id": "owner-alpha" });
  assert.equal(resolveAdminAccess(identity, "blogdocarro.com", {}).kind, "misconfigured");
  assert.equal(resolveAdminAccess(new Headers(), "blogdocarro.com", { userIds: "owner-alpha" }).kind, "anonymous");
  const emailOnly = new Headers({ "oai-authenticated-user-email": "owner@example.com" });
  assert.equal(resolveAdminAccess(emailOnly, "blogdocarro.com", {
    emailAllowlist: "owner@example.com",
    emailBootstrapEnabled: true,
  }).kind, "anonymous");
  const disabledEmailBootstrap = resolveAdminAccess(
    new Headers({
      "oai-authenticated-user-id": "stable-sites-subject",
      "oai-authenticated-user-email": "owner@example.com",
    }),
    "blogdocarro.com",
    { emailAllowlist: "owner@example.com" },
  );
  assert.equal(disabledEmailBootstrap.kind, "misconfigured");
});

test("limits local admin preview to exact loopback hosts", async () => {
  const { resolveAdminAccess } = await loadAdminAuthCore();
  for (const host of ["localhost:3000", "127.0.0.1:8787", "[::1]:4321"]) {
    assert.equal(resolveAdminAccess(new Headers(), host, {}).kind, "allowed");
  }
  for (const host of ["localhost.example.com", "127.0.0.2", "[::2]", "example.com"]) {
    assert.equal(resolveAdminAccess(new Headers(), host, {}).kind, "misconfigured");
  }
});

test("keeps SIWC return paths and mutation origins same-site", async () => {
  const { adminSignInPath, adminSignOutPath, hasMatchingRequestOrigin } = await loadAdminAuthCore();
  assert.equal(adminSignInPath("/admin/artigos?draft=1"), "/signin-with-chatgpt?return_to=%2Fadmin%2Fartigos%3Fdraft%3D1");
  assert.equal(adminSignInPath("https://evil.example/admin"), "/signin-with-chatgpt?return_to=%2Fadmin");
  assert.equal(adminSignOutPath("//evil.example"), "/signout-with-chatgpt?return_to=%2F");
  const matching = new Request("https://blogdocarro.com/api/admin", { headers: { origin: "https://blogdocarro.com" } });
  const foreign = new Request("https://blogdocarro.com/api/admin", { headers: { origin: "https://evil.example" } });
  assert.equal(hasMatchingRequestOrigin(matching), true);
  assert.equal(hasMatchingRequestOrigin(foreign), false);
});

test("rejects cross-origin admin mutations after owner authorization", async () => {
  const worker = await loadWorker();
  const configuredEnvironment = { ...environment, ADMIN_OWNER_USER_IDS: '["owner-alpha"]' };
  const response = await worker.fetch(
    new Request("https://blogdocarro.com/api/admin/orders", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "oai-authenticated-user-id": "owner-alpha",
      },
    }),
    configuredEnvironment,
    context,
  );
  assert.equal(response.status, 403);
});

test("does not treat HTTPS loopback as the local admin preview", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("https://localhost/admin"), environment, context);
  assert.equal(response.status, 503);
});

test("adds a safe request ID without reflecting invalid input", async () => {
  const worker = await loadWorker();
  const generated = await fetchRoute(worker, "/");
  assert.match(generated.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/i);

  const supplied = await worker.fetch(new Request("http://localhost/", {
    headers: { "X-Request-Id": "release-check-2026" },
  }), environment, context);
  assert.equal(supplied.headers.get("x-request-id"), "release-check-2026");

  const rejected = await worker.fetch(new Request("http://localhost/", {
    headers: { "X-Request-Id": "unsafe value with spaces" },
  }), environment, context);
  assert.notEqual(rejected.headers.get("x-request-id"), "unsafe value with spaces");
});

test("returns a sanitized and correlated response for unexpected failures", async () => {
  const worker = await loadWorker();
  const failingEnvironment = {
    ASSETS: { fetch: async () => { throw new Error("synthetic private detail"); } },
  };
  const request = new Request("http://localhost/_next/image?url=%2Fmissing.png&w=640&q=75", {
    headers: { "X-Request-Id": "release-error-check" },
  });
  const response = await worker.fetch(request, failingEnvironment, context);
  assert.equal(response.status, 500);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-request-id"), "release-error-check");
  assert.equal(await response.text(), "Internal Server Error");
});

test("renders canonical, robots and structured article metadata", async () => {
  const worker = await loadWorker();
  const article = await fetchRoute(worker, "/artigos/moto-por-spin-financiada-bom-negocio");
  const checkout = await fetchRoute(worker, "/checkout");
  const articleHtml = await article.text();
  const checkoutHtml = await checkout.text();
  assert.match(articleHtml, /rel="canonical" href="https:\/\/blogdocarro\.com\/artigos\/moto-por-spin-financiada-bom-negocio"/i);
  assert.match(articleHtml, /"@type":"Organization"/i);
  assert.match(articleHtml, /"@type":"BreadcrumbList"/i);
  assert.match(articleHtml, /"@type":"Article"/i);
  assert.match(articleHtml, /"@type":"FAQPage"/i);
  assert.doesNotMatch(articleHtml, /"datePublished"/i);
  assert.doesNotMatch(articleHtml, /youtube-nocookie\.com\/embed/i);
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
