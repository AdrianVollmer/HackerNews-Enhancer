import { assertEquals } from "@std/assert";
import { DOMParser } from "@b-fuze/deno-dom";
import { getDepth, getSubtreeIndices } from "../src/utils.ts";

function makeDoc(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

function makeRow(indentAttr: string | null): Element {
  const doc = makeDoc(
    `<table><tbody><tr class="athing comtr">` +
      `<td class="ind"${indentAttr !== null ? ` indent="${indentAttr}"` : ""}></td>` +
      `</tr></tbody></table>`,
  );
  return doc.querySelector("tr") as unknown as Element;
}

function makeRowNoCell(): Element {
  const doc = makeDoc(`<table><tbody><tr class="athing comtr"></tr></tbody></table>`);
  return doc.querySelector("tr") as unknown as Element;
}

Deno.test("getDepth: depth 0", () => {
  assertEquals(getDepth(makeRow("0")), 0);
});

Deno.test("getDepth: depth 1", () => {
  assertEquals(getDepth(makeRow("1")), 1);
});

Deno.test("getDepth: depth 2", () => {
  assertEquals(getDepth(makeRow("2")), 2);
});

Deno.test("getDepth: missing indent cell returns 0", () => {
  assertEquals(getDepth(makeRowNoCell()), 0);
});

Deno.test("getDepth: missing indent attribute returns 0", () => {
  assertEquals(getDepth(makeRow(null)), 0);
});

Deno.test("getSubtreeIndices: returns correct child indices", () => {
  const rows = [makeRow("0"), makeRow("1"), makeRow("2"), makeRow("1"), makeRow("0")];
  // row 0 depth=0, children: rows 1,2,3 (depth>0), stop at row 4 (depth=0)
  assertEquals(getSubtreeIndices(rows, 0), [1, 2, 3]);
});

Deno.test("getSubtreeIndices: leaf node returns empty", () => {
  const rows = [makeRow("0"), makeRow("1"), makeRow("0")];
  assertEquals(getSubtreeIndices(rows, 1), []);
});

Deno.test("getSubtreeIndices: last row returns empty", () => {
  const rows = [makeRow("0"), makeRow("1")];
  assertEquals(getSubtreeIndices(rows, 1), []);
});

Deno.test("getSubtreeIndices: mixed depth subtree", () => {
  const rows = [makeRow("0"), makeRow("1"), makeRow("2"), makeRow("2"), makeRow("1"), makeRow("0")];
  // root at 0: children are 1,2,3,4 (all depth>0 until row 5)
  assertEquals(getSubtreeIndices(rows, 0), [1, 2, 3, 4]);
  // root at 1: children are 2,3 (depth>1 until row 4 which is depth=1)
  assertEquals(getSubtreeIndices(rows, 1), [2, 3]);
});
