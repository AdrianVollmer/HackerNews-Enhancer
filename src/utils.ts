export function getCommentRows(): HTMLTableRowElement[] {
  return Array.from(document.querySelectorAll<HTMLTableRowElement>("tr.athing.comtr"));
}

export function getDepth(tr: Element): number {
  const cell = tr.querySelector("td.ind");
  return cell ? parseInt(cell.getAttribute("indent") ?? "0", 10) || 0 : 0;
}

export function getTimestamp(tr: Element): number {
  const age = tr.querySelector("span.age");
  if (!age) return 0;
  const parts = (age.getAttribute("title") ?? "").split(" ");
  return parts.length >= 2 ? parseInt(parts[1], 10) : 0;
}

export function getStoryTimestamp(): number {
  const age = document.querySelector("td.subtext span.age");
  if (!age) return 0;
  const parts = (age.getAttribute("title") ?? "").split(" ");
  return parts.length >= 2 ? parseInt(parts[1], 10) : 0;
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
