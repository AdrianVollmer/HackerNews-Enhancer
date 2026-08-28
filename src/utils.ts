export function getCommentRows(): HTMLTableRowElement[] {
  return Array.from(document.querySelectorAll<HTMLTableRowElement>("tr.athing.comtr"));
}

export function getDepth(tr: Element): number {
  const cell = tr.querySelector("td.ind");
  return cell ? parseInt(cell.getAttribute("indent") ?? "0", 10) || 0 : 0;
}

function parseAgeTitle(title: string): number {
  // New format: "2026-08-23T08:32:39.000000Z" (ISO only)
  // Old format: "2026-08-23T10:02:51 1787479371" (ISO + Unix timestamp)
  const parts = title.split(" ");
  if (parts.length >= 2) {
    const unix = parseInt(parts[1], 10);
    if (unix > 0) return unix;
  }
  const ms = new Date(parts[0]).getTime();
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}

export function getTimestamp(tr: Element): number {
  const age = tr.querySelector("span.age");
  if (!age) return 0;
  return parseAgeTitle(age.getAttribute("title") ?? "");
}

export function getStoryTimestamp(): number {
  const age = document.querySelector("td.subtext span.age");
  if (!age) return 0;
  return parseAgeTitle(age.getAttribute("title") ?? "");
}

export function getSubtreeIndices(rows: Element[], rootIdx: number): number[] {
  const rootDepth = getDepth(rows[rootIdx]);
  const indices: number[] = [];
  for (let i = rootIdx + 1; i < rows.length; i++) {
    if (getDepth(rows[i]) > rootDepth) indices.push(i);
    else break;
  }
  return indices;
}
