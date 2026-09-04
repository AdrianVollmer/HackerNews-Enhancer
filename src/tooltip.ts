const TOOLTIP_LINKS = new Set(["parent", "prev", "next"]);

let tooltipEl: HTMLDivElement | null = null;
let tooltipHideTimer: ReturnType<typeof setTimeout> | null = null;

function isTooltipLink(el: EventTarget | null): el is HTMLAnchorElement {
  if (!(el instanceof HTMLAnchorElement)) return false;
  return !!el.closest(".navs") && TOOLTIP_LINKS.has(el.textContent?.trim() ?? "");
}

function showParentTooltip(link: HTMLAnchorElement): void {
  if (!tooltipEl) return;
  const href = link.getAttribute("href") ?? "";
  if (!href.startsWith("#")) return;
  const targetRow = document.getElementById(href.slice(1));
  if (!targetRow) return;

  const innerTable = targetRow.querySelector("table");
  if (!innerTable) return;

  const clone = innerTable.cloneNode(true) as HTMLTableElement;
  clone.querySelector(".reply")?.remove();
  const img = clone.querySelector("td.ind img") as HTMLImageElement | null;
  if (img) img.width = 0;

  tooltipEl.replaceChildren();
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

export function initTooltip(): void {
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
