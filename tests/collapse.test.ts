import { assertEquals } from "@std/assert";
import { DOMParser } from "@b-fuze/deno-dom";
import { isPreCollapsed, normalizeHnCollapsed } from "../src/collapse.ts";

function makeDoc(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

function makeRow(classes: string[] = []): Element {
  const doc = makeDoc(
    `<table><tbody><tr class="athing comtr ${classes.join(" ")}">` +
      `<td class="ind" indent="0"></td></tr></tbody></table>`,
  );
  return doc.querySelector("tr") as unknown as Element;
}

function mockHeight(el: Element, h: number): void {
  Object.defineProperty(el, "offsetHeight", { get: () => h, configurable: true });
}

// ── isPreCollapsed ─────────────────────────────────────────────────────────────

Deno.test("isPreCollapsed: detects coll class on root", () => {
  const root = makeRow(["coll"]);
  const child = makeRow();
  mockHeight(child, 20);
  assertEquals(isPreCollapsed(root, child, 20), true);
});

Deno.test("isPreCollapsed: detects noshow class on first child", () => {
  const root = makeRow();
  const child = makeRow(["noshow"]);
  mockHeight(child, 20);
  assertEquals(isPreCollapsed(root, child, 20), true);
});

Deno.test("isPreCollapsed: detects height===0 on first child", () => {
  const root = makeRow();
  const child = makeRow();
  assertEquals(isPreCollapsed(root, child, 0), true);
});

Deno.test("isPreCollapsed: returns false when not collapsed", () => {
  const root = makeRow();
  const child = makeRow();
  assertEquals(isPreCollapsed(root, child, 42), false);
});

// ── normalizeHnCollapsed ───────────────────────────────────────────────────────

function makeRows(specs: Array<{ classes?: string[]; indent: number; height: number }>): Element[] {
  return specs.map(({ classes = [], indent, height }) => {
    const doc = makeDoc(
      `<table><tbody><tr class="athing comtr ${classes.join(" ")}">` +
        `<td class="ind" indent="${indent}"></td></tr></tbody></table>`,
    );
    const tr = doc.querySelector("tr")!;
    mockHeight(tr as unknown as Element, height);
    return tr as unknown as Element;
  });
}

Deno.test("normalizeHnCollapsed: root gets hn-collapsed, not coll", () => {
  const rows = makeRows([
    { classes: ["coll"], indent: 0, height: 20 },
    { classes: [], indent: 1, height: 15 },
  ]);
  normalizeHnCollapsed(rows);
  assertEquals(rows[0].classList.contains("hn-collapsed"), true);
  assertEquals(rows[0].classList.contains("coll"), false);
});

Deno.test("normalizeHnCollapsed: children get hn-hidden, not noshow", () => {
  const rows = makeRows([
    { classes: ["coll"], indent: 0, height: 20 },
    { classes: ["noshow"], indent: 1, height: 15 },
    { classes: ["noshow"], indent: 2, height: 15 },
  ]);
  normalizeHnCollapsed(rows);
  assertEquals(rows[1].classList.contains("hn-hidden"), true);
  assertEquals(rows[1].classList.contains("noshow"), false);
  assertEquals(rows[2].classList.contains("hn-hidden"), true);
  assertEquals(rows[2].classList.contains("noshow"), false);
});

Deno.test("normalizeHnCollapsed: unrelated rows are untouched", () => {
  const rows = makeRows([
    { classes: [], indent: 0, height: 20 },
    { classes: [], indent: 1, height: 15 },
    { classes: [], indent: 0, height: 20 },
  ]);
  normalizeHnCollapsed(rows);
  assertEquals(rows[0].classList.contains("hn-collapsed"), false);
  assertEquals(rows[2].classList.contains("hn-collapsed"), false);
  assertEquals(rows[1].classList.contains("hn-hidden"), false);
});

Deno.test("normalizeHnCollapsed: strips display:none from children", () => {
  const rows = makeRows([
    { classes: [], indent: 0, height: 20 },
    { classes: ["noshow"], indent: 1, height: 15 },
  ]);
  rows[1].setAttribute("style", "display: none");
  normalizeHnCollapsed(rows);
  const style = rows[1].getAttribute("style") ?? "";
  assertEquals(/display\s*:\s*none/.test(style), false);
});

Deno.test("normalizeHnCollapsed: detects via firstChild height===0", () => {
  const rows = makeRows([
    { classes: [], indent: 0, height: 20 },
    { classes: [], indent: 1, height: 0 },
  ]);
  normalizeHnCollapsed(rows);
  assertEquals(rows[0].classList.contains("hn-collapsed"), true);
  assertEquals(rows[1].classList.contains("hn-hidden"), true);
});

Deno.test("normalizeHnCollapsed: already-hidden rows (height===0) are skipped as roots", () => {
  const rows = makeRows([
    { classes: ["coll"], indent: 0, height: 0 },
    { classes: [], indent: 1, height: 10 },
  ]);
  normalizeHnCollapsed(rows);
  assertEquals(rows[0].classList.contains("hn-collapsed"), false);
});
