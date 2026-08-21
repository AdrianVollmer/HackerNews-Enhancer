import { getStoryTimestamp, getTimestamp } from "./utils.ts";

function formatAgo(nowApprox: number, ts: number): string {
  const mins = Math.round((nowApprox - ts) / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

export function initSlider(rows: Element[]): void {
  const storyTs = getStoryTimestamp();
  const timestamps = rows.map(getTimestamp).filter((t) => t > 0 && (storyTs === 0 || t >= storyTs));
  if (timestamps.length === 0) return;

  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const nowApprox = Math.floor(Date.now() / 1000);

  const slider = document.getElementById("hn-age-slider") as HTMLInputElement | null;
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
