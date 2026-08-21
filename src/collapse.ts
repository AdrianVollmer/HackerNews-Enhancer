import { getDepth, getSubtreeIndices } from "./utils.ts";

let collapseOverlay: HTMLDivElement | null = null;

export function isPreCollapsed(
  tr: Element,
  firstChild: Element,
  firstChildHeight: number,
): boolean {
  return (
    tr.classList.contains("coll") ||
    firstChild.classList.contains("noshow") ||
    firstChildHeight === 0
  );
}

export function normalizeHnCollapsed(rows: Element[]): void {
  const heights = rows.map((tr) => (tr as HTMLElement).offsetHeight);
  rows.forEach((tr, i) => {
    if (heights[i] === 0) return;
    const subtreeIdxs = getSubtreeIndices(rows, i);
    if (subtreeIdxs.length === 0) return;
    const firstChild = rows[subtreeIdxs[0]];
    if (!isPreCollapsed(tr, firstChild, heights[subtreeIdxs[0]])) return;
    tr.classList.remove("coll");
    tr.classList.add("hn-collapsed");
    subtreeIdxs.forEach((j) => {
      const row = rows[j];
      const style = row.getAttribute("style") ?? "";
      if (/display\s*:\s*none/.test(style)) {
        row.setAttribute("style", style.replace(/display\s*:\s*none\s*;?/g, "").trim());
      }
      row.classList.remove("noshow");
      row.classList.add("hn-hidden");
    });
  });
}

export function buildCollapseOverlay(rows: Element[]): void {
  if (!collapseOverlay) {
    collapseOverlay = document.createElement("div");
    collapseOverlay.id = "hn-collapse-overlay";
    document.body.appendChild(collapseOverlay);
  }

  document.querySelectorAll(".hn-collapsed-count").forEach((el) => el.remove());

  const scrollY = globalThis.scrollY;
  const scrollX = globalThis.scrollX;
  const BAR_W = 6;
  const MARGIN = 4;

  const specs: Array<{
    tr: Element;
    i: number;
    isCollapsed: boolean;
    topY: number;
    left: number;
    height: number;
    count: number;
  }> = [];

  rows.forEach((tr, i) => {
    const subtreeIdxs = getSubtreeIndices(rows, i);
    const isCollapsed = tr.classList.contains("hn-collapsed");
    const trRect = tr.getBoundingClientRect();
    const topY = trRect.top + scrollY;

    let botY: number;
    if (isCollapsed) {
      botY = trRect.bottom + scrollY;
    } else {
      let lastVisible = tr;
      for (const j of subtreeIdxs) {
        if (!rows[j].classList.contains("hn-hidden")) lastVisible = rows[j];
      }
      botY = lastVisible.getBoundingClientRect().bottom + scrollY;
    }

    const height = botY - topY;
    if (height < 4) return;

    const indCell = tr.querySelector("td.ind");
    if (!indCell) return;

    const HN_INDENT_STEP = 40;
    const depth = getDepth(tr);
    const indLeft = indCell.getBoundingClientRect().left + scrollX;
    const left = indLeft +
      depth * HN_INDENT_STEP -
      Math.floor(HN_INDENT_STEP / 2) -
      Math.floor(BAR_W / 2);

    specs.push({
      tr,
      i,
      isCollapsed,
      topY: topY + MARGIN,
      left,
      height: height - MARGIN * 2,
      count: subtreeIdxs.length,
    });
  });

  const fragment = document.createDocumentFragment();
  specs.forEach(({ tr, i, isCollapsed, topY, left, height, count }) => {
    const bar = document.createElement("div");
    bar.className = "hn-cbar" + (isCollapsed ? " hn-collapsed" : "");
    bar.style.cssText = `top:${topY}px;left:${left}px;height:${height}px`;
    bar.title = isCollapsed
      ? count > 0 ? `Expand ${count} comment${count !== 1 ? "s" : ""}` : "Expand comment"
      : count > 0
      ? "Collapse thread"
      : "Collapse comment";

    if (isCollapsed && count > 0) {
      const navs = tr.querySelector(".navs");
      if (navs) {
        const badge = document.createElement("span");
        badge.className = "hn-collapsed-count";
        badge.textContent = `+${count}`;
        navs.appendChild(badge);
      }
    }

    bar.addEventListener("click", () => toggleCollapse(rows, i));
    fragment.appendChild(bar);
  });

  collapseOverlay.innerHTML = "";
  collapseOverlay.appendChild(fragment);
}

export function toggleCollapse(rows: Element[], rootIdx: number): void {
  const rootTr = rows[rootIdx];
  const rootDepth = getDepth(rootTr);
  const nowCollapsed = !rootTr.classList.contains("hn-collapsed");
  rootTr.classList.toggle("hn-collapsed", nowCollapsed);
  for (let j = rootIdx + 1; j < rows.length; j++) {
    if (getDepth(rows[j]) > rootDepth) rows[j].classList.toggle("hn-hidden", nowCollapsed);
    else break;
  }
  setTimeout(() => buildCollapseOverlay(rows), 30);
}

export function hideNativeToggles(): void {
  const style = document.createElement("style");
  style.textContent = "a.togg { display: none !important; }";
  document.head.appendChild(style);
}

export function initCollapseRebuild(rows: Element[]): void {
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  globalThis.addEventListener("resize", () => {
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => buildCollapseOverlay(rows), 150);
  });
}
