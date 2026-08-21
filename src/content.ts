import { getCommentRows } from "./utils.ts";
import { createPanel } from "./panel.ts";
import { initSlider } from "./slider.ts";
import {
  buildCollapseOverlay,
  hideNativeToggles,
  initCollapseRebuild,
  normalizeHnCollapsed,
} from "./collapse.ts";
import { colorizeScores } from "./scores.ts";
import { renderMarkdown } from "./markdown.ts";
import { initTooltip } from "./tooltip.ts";

function init(): void {
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
