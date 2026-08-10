import assert from "node:assert/strict";
import test from "node:test";
import { buildAudienceConfirmationEmail, buildCustomerAccessEmail } from "../server/email-templates.ts";

const confirmationLink = "https://blogdocarro.com/confirmar-inscricao#token=fixture-token";

test("keeps audience purposes independent in subject, copy and CTA", () => {
  const newsletter = buildAudienceConfirmationEmail(confirmationLink, "editorial_newsletter");
  const store = buildAudienceConfirmationEmail(confirmationLink, "store_launch");
  assert.match(newsletter.subject, /artigos/u);
  assert.match(newsletter.html, /Quero receber os artigos/u);
  assert.match(newsletter.html, /Loja da Comunidade continua separada/u);
  assert.match(store.subject, /Loja da Comunidade/u);
  assert.match(store.html, /Confirmar meu interesse/u);
  assert.match(store.html, /não ativa a newsletter/u);
});

test("builds accessible email HTML and equivalent plain text", () => {
  const email = buildCustomerAccessEmail("https://blogdocarro.com/entrar/confirmar#token=fixture-token");
  assert.match(email.html, /<!doctype html>/u);
  assert.match(email.html, /lang="pt-BR"/u);
  assert.match(email.html, /role="presentation"/u);
  assert.match(email.html, /bgcolor="#F4B400"/u);
  assert.match(email.html, /alt=""/u);
  assert.doesNotMatch(email.html, /<script|<form|tracking|pixel/iu);
  assert.match(email.text, /Entrar no Blog do Carro: https:\/\/blogdocarro\.com/u);
  assert.doesNotMatch(email.text, /<[^>]+>/u);
});

test("rejects non-HTTPS links outside loopback", () => {
  assert.throws(() => buildCustomerAccessEmail("http://example.com/access#token=x"), /HTTPS/u);
  assert.doesNotThrow(() => buildCustomerAccessEmail("http://localhost:3000/access#token=x"));
});

test("escapes link attributes and preserves fragment tokens", () => {
  const email = buildCustomerAccessEmail("https://blogdocarro.com/entrar/confirmar#token=a&mode=b");
  assert.match(email.html, /#token=a&amp;mode=b/u);
  assert.match(email.text, /#token=a&mode=b/u);
});
