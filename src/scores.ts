const STORY_TIERS = [50, 100, 300, 700, 1500];
const COMMENT_TIERS = [20, 50, 150, 350, 800];
const OWN_TIERS = [1, 3, 6, 10, 15];

function tier(n: number, thresholds: number[]): number {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (n >= thresholds[i]) return i + 1;
  }
  return 0;
}

export function colorizeScores(): void {
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
