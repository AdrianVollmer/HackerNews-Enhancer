import { assertEquals, assertStringIncludes } from "@std/assert";
import { DOMParser } from "@b-fuze/deno-dom";
import { applyInlineToTextNode, renderMarkdown } from "../src/markdown.ts";

function setupDocument(bodyHtml = "<body></body>"): Document {
  const doc = new DOMParser().parseFromString(
    `<!DOCTYPE html><html>${bodyHtml}</html>`,
    "text/html",
  ) as unknown as Document;
  // deno-lint-ignore no-explicit-any
  (globalThis as any).document = doc;
  return doc;
}

// ── applyInlineToTextNode ──────────────────────────────────────────────────────

Deno.test("applyInlineToTextNode: bold **text**", () => {
  const doc = setupDocument();
  const container = doc.createElement("span");
  const text = doc.createTextNode("hello **world** end");
  container.appendChild(text);
  doc.body.appendChild(container);

  applyInlineToTextNode(text);

  assertStringIncludes(container.innerHTML, "<strong>world</strong>");
});

Deno.test("applyInlineToTextNode: italic *text*", () => {
  const doc = setupDocument();
  const container = doc.createElement("span");
  const text = doc.createTextNode("hello *world* end");
  container.appendChild(text);
  doc.body.appendChild(container);

  applyInlineToTextNode(text);

  assertStringIncludes(container.innerHTML, "<em>world</em>");
});

Deno.test("applyInlineToTextNode: inline code `text`", () => {
  const doc = setupDocument();
  const container = doc.createElement("span");
  const text = doc.createTextNode("use `code` here");
  container.appendChild(text);
  doc.body.appendChild(container);

  applyInlineToTextNode(text);

  assertStringIncludes(container.innerHTML, "<code>code</code>");
});

Deno.test("applyInlineToTextNode: no markers leaves node unchanged", () => {
  const doc = setupDocument();
  const container = doc.createElement("span");
  const text = doc.createTextNode("plain text");
  container.appendChild(text);
  doc.body.appendChild(container);

  applyInlineToTextNode(text);

  assertEquals(container.textContent, "plain text");
  assertEquals(container.childNodes.length, 1);
});

Deno.test("applyInlineToTextNode: raw marker spans are included", () => {
  const doc = setupDocument();
  const container = doc.createElement("span");
  const text = doc.createTextNode("**bold**");
  container.appendChild(text);
  doc.body.appendChild(container);

  applyInlineToTextNode(text);

  assertStringIncludes(container.innerHTML, 'class="hn-md-raw"');
});

// ── renderMarkdown ─────────────────────────────────────────────────────────────

Deno.test("renderMarkdown: blockquote from > text", () => {
  const doc = setupDocument();
  const commtext = doc.createElement("div");
  commtext.appendChild(doc.createTextNode("> quoted text"));
  doc.body.appendChild(commtext);

  renderMarkdown(commtext);

  const bq = commtext.querySelector("blockquote");
  assertEquals(bq !== null, true);
  assertStringIncludes(bq!.textContent ?? "", "quoted text");
});

Deno.test("renderMarkdown: blockquote from > inside <p>", () => {
  const doc = setupDocument();
  const commtext = doc.createElement("div");
  const p = doc.createElement("p");
  p.appendChild(doc.createTextNode("> paragraph quote"));
  commtext.appendChild(p);
  doc.body.appendChild(commtext);

  renderMarkdown(commtext);

  const bq = commtext.querySelector("blockquote");
  assertEquals(bq !== null, true);
});

Deno.test("renderMarkdown: inline bold applied in commtext", () => {
  const doc = setupDocument();
  const commtext = doc.createElement("div");
  commtext.appendChild(doc.createTextNode("hello **world**"));
  doc.body.appendChild(commtext);

  renderMarkdown(commtext);

  assertStringIncludes(commtext.innerHTML, "<strong>world</strong>");
});

Deno.test("renderMarkdown: text inside <code> is not processed for inline", () => {
  const doc = setupDocument();
  const commtext = doc.createElement("div");
  const code = doc.createElement("code");
  code.textContent = "**not bold**";
  commtext.appendChild(code);
  doc.body.appendChild(commtext);

  renderMarkdown(commtext);

  assertEquals(code.querySelector("strong"), null);
  assertEquals(code.textContent, "**not bold**");
});
