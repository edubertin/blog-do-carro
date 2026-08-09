import assert from "node:assert/strict";
import test from "node:test";
import { consentText, normalizeAudienceEmail, normalizeSourcePath } from "../domain/audience.ts";

test("normalizes one conservative email address", () => {
  assert.equal(normalizeAudienceEmail("  Pessoa@Exemplo.COM  "), "pessoa@exemplo.com");
  assert.equal(normalizeAudienceEmail("a@b.com,c@d.com"), null);
  assert.equal(normalizeAudienceEmail("sem-arroba.example"), null);
  assert.equal(normalizeAudienceEmail(`a@b.com${String.fromCharCode(10)}`), null);
});

test("accepts only same-site source paths", () => {
  assert.equal(normalizeSourcePath("/loja?produto=chaveiro"), "/loja?produto=chaveiro");
  assert.equal(normalizeSourcePath("https://evil.example/"), null);
  assert.equal(normalizeSourcePath("//evil.example/"), null);
  assert.equal(normalizeSourcePath("/loja\\admin"), null);
});

test("keeps marketing consent separate by purpose", () => {
  assert.notEqual(consentText("store_launch"), consentText("editorial_newsletter"));
  assert.match(consentText("store_launch"), /Loja da Comunidade/u);
  assert.match(consentText("editorial_newsletter"), /artigos/u);
});
