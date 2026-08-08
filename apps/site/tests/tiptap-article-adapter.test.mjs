import assert from "node:assert/strict";
import test from "node:test";
import { articleDocumentToTiptap, tiptapToArticleDocument } from "../domain/tiptap-article-adapter.ts";

const article = {
  schemaVersion: 1,
  blocks: [
    { id: "p-1", type: "paragraph", text: "Antes da imagem." },
    { id: "h-1", type: "heading", level: 2, text: "Referência" },
    {
      id: "i-1",
      type: "image",
      assetId: "0b19fbb1-dc2a-4dc2-a2d2-73c31c39d350",
      alt: "Motocicleta preta vista de lado",
      caption: "Imagem enviada pelo CMS.",
      alignment: "wide",
      width: 1080,
      height: 720,
    },
    { id: "p-2", type: "paragraph", text: "Depois da imagem." },
  ],
};

test("round-trips the supported editorial document without losing metadata", () => {
  assert.deepEqual(tiptapToArticleDocument(articleDocumentToTiptap(article)), article);
});

test("preserves empty paragraphs as cursor positions", () => {
  const source = { schemaVersion: 1, blocks: [{ id: "empty", type: "paragraph", text: "" }] };
  assert.deepEqual(tiptapToArticleDocument(articleDocumentToTiptap(source)), source);
});

test("preserves an image without optional caption or dimensions", () => {
  const source = {
    schemaVersion: 1,
    blocks: [{
      id: "image",
      type: "image",
      assetId: "0b19fbb1-dc2a-4dc2-a2d2-73c31c39d350",
      alt: "Imagem sem legenda",
      alignment: "inline",
    }],
  };
  assert.deepEqual(tiptapToArticleDocument(articleDocumentToTiptap(source)), source);
});

test("rejects unsupported nodes and marks", () => {
  assert.throws(() => tiptapToArticleDocument({ type: "doc", content: [{ type: "bulletList", attrs: {} }] }));
  assert.throws(() => tiptapToArticleDocument({
    type: "doc",
    content: [{ type: "paragraph", attrs: { id: "p" }, content: [{ type: "text", text: "x", marks: [{ type: "bold" }] }] }],
  }));
});

test("rejects HTML, base64 and external image attributes", () => {
  for (const forbidden of [
    { src: "https://example.com/image.jpg" },
    { src: "data:image/png;base64,AAAA" },
    { html: "<img src=x onerror=alert(1)>" },
  ]) {
    assert.throws(() => tiptapToArticleDocument({
      type: "doc",
      content: [{
        type: "image",
        attrs: {
          id: "image",
          assetId: "0b19fbb1-dc2a-4dc2-a2d2-73c31c39d350",
          alt: "Descrição",
          alignment: "inline",
          ...forbidden,
        },
      }],
    }));
  }
  for (const assetId of ["https://example.com/image.jpg", "data:image/png;base64,AAAA", "/media/external"]) {
    assert.throws(() => tiptapToArticleDocument({
      type: "doc",
      content: [{ type: "image", attrs: { id: "image", assetId, alt: "Descrição", alignment: "inline" } }],
    }));
  }
});

test("rejects invalid image metadata", () => {
  const attrs = { id: "image", assetId: "asset", alt: "Descrição", alignment: "inline", width: 500 };
  assert.throws(() => tiptapToArticleDocument({ type: "doc", content: [{ type: "image", attrs }] }));
  assert.throws(() => tiptapToArticleDocument({
    type: "doc",
    content: [{ type: "image", attrs: { ...attrs, width: undefined, alignment: "center" } }],
  }));
});
