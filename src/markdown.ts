const SKIP_INLINE = new Set(["A", "CODE", "STRONG", "EM"]);
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function rawSpan(text: string): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = "hn-md-raw";
  s.textContent = text;
  return s;
}

export function applyInlineToTextNode(node: Text): void {
  const raw = node.textContent ?? "";
  if (!/[*`]/.test(raw)) return;
  const escaped = escapeHtml(raw);
  const R = '<span class="hn-md-raw">';
  const html = escaped
    .replace(/\*\*([^*\n]+)\*\*/g, `${R}**</span><strong>$1</strong>${R}**</span>`)
    .replace(/\*([^*\n]+)\*/g, `${R}*</span><em>$1</em>${R}*</span>`)
    .replace(/`([^`\n]+)`/g, `${R}\`</span><code>$1</code>${R}\`</span>`);
  if (html === escaped) return;
  const tmp = document.createElement("span");
  tmp.innerHTML = html;
  const frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  node.parentNode!.replaceChild(frag, node);
}

function collectTextNodes(root: Element): Text[] {
  const result: Text[] = [];
  function walk(node: Node): void {
    if (node.nodeType === TEXT_NODE) {
      result.push(node as Text);
      return;
    }
    if (node.nodeType === ELEMENT_NODE && SKIP_INLINE.has((node as Element).tagName)) return;
    for (const child of Array.from(node.childNodes)) walk(child);
  }
  for (const child of Array.from(root.childNodes)) walk(child);
  return result;
}

export function renderMarkdown(commtext: Element): void {
  Array.from(commtext.childNodes).forEach((node) => {
    const isText = node.nodeType === TEXT_NODE;
    const isP = node.nodeType === ELEMENT_NODE && (node as Element).tagName === "P";
    if (!isText && !isP) return;

    const leadText = isText
      ? (node as Text).textContent ?? ""
      : node.firstChild?.nodeType === TEXT_NODE
      ? (node.firstChild as Text).textContent ?? ""
      : "";
    if (!/^\s*>/.test(leadText)) return;

    const bq = document.createElement("blockquote");
    if (isText) {
      const m = (node as Text).textContent!.match(/^(\s*>\s*)([\s\S]*)$/);
      if (m) {
        bq.appendChild(rawSpan(m[1]));
        bq.appendChild(document.createTextNode(m[2]));
      }
      commtext.replaceChild(bq, node);
    } else {
      const fc = node.firstChild;
      if (fc?.nodeType === TEXT_NODE) {
        const m = (fc as Text).textContent!.match(/^(\s*>\s*)([\s\S]*)$/);
        if (m) {
          bq.appendChild(rawSpan(m[1]));
          (fc as Text).textContent = m[2];
        }
      }
      while (node.firstChild) bq.appendChild(node.firstChild);
      commtext.replaceChild(bq, node);
    }
  });

  collectTextNodes(commtext).forEach(applyInlineToTextNode);
}
