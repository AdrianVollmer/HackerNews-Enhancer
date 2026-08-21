// src/utils.ts
function getCommentRows() {
  return Array.from(document.querySelectorAll("tr.athing.comtr"));
}
function getDepth(tr) {
  const cell = tr.querySelector("td.ind");
  return cell ? parseInt(cell.getAttribute("indent") ?? "0", 10) || 0 : 0;
}
function getTimestamp(tr) {
  const age = tr.querySelector("span.age");
  if (!age) return 0;
  const parts = (age.getAttribute("title") ?? "").split(" ");
  return parts.length >= 2 ? parseInt(parts[1], 10) : 0;
}
function getStoryTimestamp() {
  const age = document.querySelector("td.subtext span.age");
  if (!age) return 0;
  const parts = (age.getAttribute("title") ?? "").split(" ");
  return parts.length >= 2 ? parseInt(parts[1], 10) : 0;
}
function getSubtreeIndices(rows, rootIdx) {
  const rootDepth = getDepth(rows[rootIdx]);
  const indices = [];
  for (let i = rootIdx + 1; i < rows.length; i++) {
    if (getDepth(rows[i]) > rootDepth) indices.push(i);
    else break;
  }
  return indices;
}

// src/panel.ts
function loadPrefs() {
  return {
    darkMode: localStorage.getItem("hn-dark") === "1"
  };
}
function savePref(key, value) {
  if (key === "darkMode") localStorage.setItem("hn-dark", value ? "1" : "0");
}
function applyDark(on) {
  document.documentElement.classList.toggle("hn-dark", on);
  document.body.classList.toggle("hn-dark", on);
  const toggle = document.getElementById("hn-theme-toggle");
  if (toggle) toggle.classList.toggle("hn-on", on);
}
function createPanel() {
  const prefs = loadPrefs();
  const btn = document.createElement("div");
  btn.id = "hn-ext-btn";
  btn.title = "HN Enhancer";
  btn.textContent = "\u2699";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("hn-ext-panel")?.classList.toggle("hn-open");
  });
  document.body.appendChild(btn);
  const panel = document.createElement("div");
  panel.id = "hn-ext-panel";
  const themeSection = document.createElement("div");
  themeSection.innerHTML = `
      <div class="hn-panel-label">Appearance</div>
      <div class="hn-panel-row">
        <span>Dark theme</span>
        <div class="hn-pill-toggle" id="hn-theme-toggle"></div>
      </div>`;
  panel.appendChild(themeSection);
  const sliderSection = document.createElement("div");
  sliderSection.innerHTML = `
      <div class="hn-panel-label">Highlight newer than</div>
      <input type="range" id="hn-age-slider">
      <div class="hn-slider-labels">
        <span id="hn-lbl-old">oldest</span>
        <span id="hn-lbl-new">newest</span>
      </div>
      <div class="hn-slider-value" id="hn-slider-display">No highlight</div>`;
  panel.appendChild(sliderSection);
  document.body.appendChild(panel);
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove("hn-open");
    }
  });
  document.getElementById("hn-theme-toggle").addEventListener("click", () => {
    const isDark = document.body.classList.contains("hn-dark");
    applyDark(!isDark);
    savePref("darkMode", !isDark);
  });
  applyDark(prefs.darkMode);
}

// src/slider.ts
function formatAgo(nowApprox, ts) {
  const mins = Math.round((nowApprox - ts) / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}
function initSlider(rows) {
  const storyTs = getStoryTimestamp();
  const timestamps = rows.map(getTimestamp).filter((t) => t > 0 && (storyTs === 0 || t >= storyTs));
  if (timestamps.length === 0) return;
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const nowApprox = Math.floor(Date.now() / 1e3);
  const slider = document.getElementById("hn-age-slider");
  if (!slider) return;
  slider.min = String(minTs);
  slider.max = String(maxTs);
  slider.value = String(maxTs);
  const lblOld = document.getElementById("hn-lbl-old");
  const lblNew = document.getElementById("hn-lbl-new");
  if (lblOld) lblOld.textContent = formatAgo(nowApprox, minTs);
  if (lblNew) lblNew.textContent = formatAgo(nowApprox, maxTs);
  const display = document.getElementById("hn-slider-display");
  slider.addEventListener("input", () => {
    const val = parseInt(slider.value, 10);
    if (val >= maxTs) {
      if (display) display.textContent = "No highlight";
      rows.forEach((tr) => tr.classList.remove("hn-new-comment"));
    } else {
      if (display) display.textContent = `Newer than: ${formatAgo(nowApprox, val)}`;
      rows.forEach((tr) => {
        tr.classList.toggle("hn-new-comment", getTimestamp(tr) > val);
      });
    }
  });
}

// src/collapse.ts
var collapseOverlay = null;
function isPreCollapsed(tr, firstChild, firstChildHeight) {
  return tr.classList.contains("coll") || firstChild.classList.contains("noshow") || firstChildHeight === 0;
}
function normalizeHnCollapsed(rows) {
  const heights = rows.map((tr) => tr.offsetHeight);
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
function buildCollapseOverlay(rows) {
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
  const specs = [];
  rows.forEach((tr, i) => {
    const subtreeIdxs = getSubtreeIndices(rows, i);
    const isCollapsed = tr.classList.contains("hn-collapsed");
    const trRect = tr.getBoundingClientRect();
    const topY = trRect.top + scrollY;
    let botY;
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
    const left = indLeft + depth * HN_INDENT_STEP - Math.floor(HN_INDENT_STEP / 2) - Math.floor(BAR_W / 2);
    specs.push({
      tr,
      i,
      isCollapsed,
      topY: topY + MARGIN,
      left,
      height: height - MARGIN * 2,
      count: subtreeIdxs.length
    });
  });
  const fragment = document.createDocumentFragment();
  specs.forEach(({ tr, i, isCollapsed, topY, left, height, count }) => {
    const bar = document.createElement("div");
    bar.className = "hn-cbar" + (isCollapsed ? " hn-collapsed" : "");
    bar.style.cssText = `top:${topY}px;left:${left}px;height:${height}px`;
    bar.title = isCollapsed ? count > 0 ? `Expand ${count} comment${count !== 1 ? "s" : ""}` : "Expand comment" : count > 0 ? "Collapse thread" : "Collapse comment";
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
function toggleCollapse(rows, rootIdx) {
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
function hideNativeToggles() {
  const style = document.createElement("style");
  style.textContent = "a.togg { display: none !important; }";
  document.head.appendChild(style);
}
function initCollapseRebuild(rows) {
  let resizeTimer = null;
  globalThis.addEventListener("resize", () => {
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => buildCollapseOverlay(rows), 150);
  });
}

// src/scores.ts
var STORY_TIERS = [
  50,
  100,
  300,
  700,
  1500
];
var COMMENT_TIERS = [
  20,
  50,
  150,
  350,
  800
];
var OWN_TIERS = [
  1,
  3,
  6,
  10,
  15
];
function tier(n, thresholds) {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (n >= thresholds[i]) return i + 1;
  }
  return 0;
}
function colorizeScores() {
  document.querySelectorAll("td.subtext span.score").forEach((el) => {
    const n = parseInt(el.textContent?.replace(/,/g, "") ?? "", 10);
    const t = tier(n, STORY_TIERS);
    if (t) el.classList.add(`hn-score-${t}`);
  });
  document.querySelectorAll("td.subtext").forEach((td) => {
    const links = Array.from(td.querySelectorAll("a"));
    const link = links.reverse().find((a) => /[\d,]+\s+comment/.test(a.textContent ?? ""));
    if (!link) return;
    const n = parseInt(link.textContent?.replace(/,/g, "") ?? "", 10);
    const t = tier(n, COMMENT_TIERS);
    if (t) link.classList.add(`hn-score-${t}`);
  });
  document.querySelectorAll("tr.athing.comtr span.score").forEach((el) => {
    const n = parseInt(el.textContent?.replace(/,/g, "") ?? "", 10);
    const t = tier(n, OWN_TIERS);
    if (t) el.classList.add(`hn-score-${t}`);
  });
}

// src/markdown.ts
var SKIP_INLINE = /* @__PURE__ */ new Set([
  "A",
  "CODE",
  "STRONG",
  "EM"
]);
var TEXT_NODE = 3;
var ELEMENT_NODE = 1;
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function rawSpan(text) {
  const s = document.createElement("span");
  s.className = "hn-md-raw";
  s.textContent = text;
  return s;
}
function applyInlineToTextNode(node) {
  const raw = node.textContent ?? "";
  if (!/[*`]/.test(raw)) return;
  const escaped = escapeHtml(raw);
  const R = '<span class="hn-md-raw">';
  const html = escaped.replace(/\*\*([^*\n]+)\*\*/g, `${R}**</span><strong>$1</strong>${R}**</span>`).replace(/\*([^*\n]+)\*/g, `${R}*</span><em>$1</em>${R}*</span>`).replace(/`([^`\n]+)`/g, `${R}\`</span><code>$1</code>${R}\`</span>`);
  if (html === escaped) return;
  const tmp = document.createElement("span");
  tmp.innerHTML = html;
  const frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  node.parentNode.replaceChild(frag, node);
}
function collectTextNodes(root) {
  const result = [];
  function walk(node) {
    if (node.nodeType === TEXT_NODE) {
      result.push(node);
      return;
    }
    if (node.nodeType === ELEMENT_NODE && SKIP_INLINE.has(node.tagName)) return;
    for (const child of Array.from(node.childNodes)) walk(child);
  }
  for (const child of Array.from(root.childNodes)) walk(child);
  return result;
}
function renderMarkdown(commtext) {
  Array.from(commtext.childNodes).forEach((node) => {
    const isText = node.nodeType === TEXT_NODE;
    const isP = node.nodeType === ELEMENT_NODE && node.tagName === "P";
    if (!isText && !isP) return;
    const leadText = isText ? node.textContent ?? "" : node.firstChild?.nodeType === TEXT_NODE ? node.firstChild.textContent ?? "" : "";
    if (!/^\s*>/.test(leadText)) return;
    const bq = document.createElement("blockquote");
    if (isText) {
      const m = node.textContent.match(/^(\s*>\s*)([\s\S]*)$/);
      if (m) {
        bq.appendChild(rawSpan(m[1]));
        bq.appendChild(document.createTextNode(m[2]));
      }
      commtext.replaceChild(bq, node);
    } else {
      const fc = node.firstChild;
      if (fc?.nodeType === TEXT_NODE) {
        const m = fc.textContent.match(/^(\s*>\s*)([\s\S]*)$/);
        if (m) {
          bq.appendChild(rawSpan(m[1]));
          fc.textContent = m[2];
        }
      }
      while (node.firstChild) bq.appendChild(node.firstChild);
      commtext.replaceChild(bq, node);
    }
  });
  collectTextNodes(commtext).forEach(applyInlineToTextNode);
}

// src/tooltip.ts
var TOOLTIP_LINKS = /* @__PURE__ */ new Set([
  "parent",
  "prev",
  "next"
]);
var tooltipEl = null;
var tooltipHideTimer = null;
function isTooltipLink(el) {
  if (!(el instanceof HTMLAnchorElement)) return false;
  return !!el.closest(".navs") && TOOLTIP_LINKS.has(el.textContent?.trim() ?? "");
}
function showParentTooltip(link) {
  if (!tooltipEl) return;
  const href = link.getAttribute("href") ?? "";
  if (!href.startsWith("#")) return;
  const targetRow = document.getElementById(href.slice(1));
  if (!targetRow) return;
  const innerTable = targetRow.querySelector("table");
  if (!innerTable) return;
  const clone = innerTable.cloneNode(true);
  clone.querySelector(".reply")?.remove();
  const img = clone.querySelector("td.ind img");
  if (img) img.width = 0;
  tooltipEl.innerHTML = "";
  const label = document.createElement("div");
  label.className = "hn-tooltip-label";
  label.textContent = (link.textContent?.trim() ?? "") + " comment";
  tooltipEl.appendChild(label);
  tooltipEl.appendChild(clone);
  tooltipEl.style.maxHeight = `${Math.floor(globalThis.innerHeight / 2)}px`;
  tooltipEl.style.left = "-9999px";
  tooltipEl.style.top = "-9999px";
  tooltipEl.classList.add("hn-visible");
  const r = link.getBoundingClientRect();
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;
  const vw = globalThis.innerWidth;
  const vh = globalThis.innerHeight;
  const G = 8;
  let top = r.bottom + G;
  if (top + th > vh - G) top = r.top - th - G;
  let left = r.left;
  if (left + tw > vw - G) left = vw - tw - G;
  if (left < G) left = G;
  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}
function initTooltip() {
  tooltipEl = document.createElement("div");
  tooltipEl.id = "hn-parent-tooltip";
  document.body.appendChild(tooltipEl);
  document.addEventListener("mouseover", (e) => {
    if (!isTooltipLink(e.target)) return;
    if (tooltipHideTimer !== null) clearTimeout(tooltipHideTimer);
    showParentTooltip(e.target);
  });
  document.addEventListener("mouseout", (e) => {
    if (!isTooltipLink(e.target)) return;
    tooltipHideTimer = setTimeout(() => {
      tooltipEl?.classList.remove("hn-visible");
    }, 80);
  });
}

// src/content.ts
function init() {
  createPanel();
  if (getComputedStyle(document.body).position === "static") {
    document.body.style.position = "relative";
  }
  const rows = getCommentRows();
  colorizeScores();
  document.querySelectorAll(".commtext").forEach(renderMarkdown);
  if (rows.length > 0) {
    hideNativeToggles();
    normalizeHnCollapsed(rows);
    initSlider(rows);
    buildCollapseOverlay(rows);
    initCollapseRebuild(rows);
    initTooltip();
  }
  document.body.dataset["hnEnhancer"] = "ready";
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
