// hn-enhancer/content.js
(function hnEnhancer() {
  'use strict';

  // ── Utilities ──────────────────────────────────────────────────────────────

  function getCommentRows() {
    return Array.from(document.querySelectorAll('tr.athing.comtr'));
  }

  function getDepth(tr) {
    const cell = tr.querySelector('td.ind');
    return cell ? (parseInt(cell.getAttribute('indent'), 10) || 0) : 0;
  }

  function getTimestamp(tr) {
    const age = tr.querySelector('span.age');
    if (!age) return 0;
    const parts = (age.getAttribute('title') || '').split(' ');
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

  // ── Storage ────────────────────────────────────────────────────────────────

  async function loadPrefs() {
    try {
      const result = await browser.storage.local.get(['darkMode']);
      return { darkMode: result.darkMode === true };
    } catch (e) {
      return { darkMode: false };
    }
  }

  async function savePref(key, value) {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch (e) {}
  }

  // ── Dark mode ──────────────────────────────────────────────────────────────

  function applyDark(on) {
    document.body.classList.toggle('hn-dark', on);
    const toggle = document.getElementById('hn-theme-toggle');
    if (toggle) toggle.classList.toggle('hn-on', on);
  }

  // ── Panel ──────────────────────────────────────────────────────────────────

  function createPanel() {
    const btn = document.createElement('div');
    btn.id = 'hn-ext-btn';
    btn.title = 'HN Enhancer';
    btn.textContent = '⚙';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('hn-ext-panel').classList.toggle('hn-open');
    });
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'hn-ext-panel';

    const themeSection = document.createElement('div');
    themeSection.innerHTML = `
      <div class="hn-panel-label">Appearance</div>
      <div class="hn-panel-row">
        <span>Dark theme</span>
        <div class="hn-pill-toggle" id="hn-theme-toggle"></div>
      </div>`;
    panel.appendChild(themeSection);

    const sliderSection = document.createElement('div');
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

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('hn-open');
      }
    });

    document.getElementById('hn-theme-toggle').addEventListener('click', () => {
      const isDark = document.body.classList.contains('hn-dark');
      applyDark(!isDark);
      savePref('darkMode', !isDark);
    });
  }

  // ── Slider ────────────────────────────────────────────────────────────────

  function initSlider(rows) {
    const timestamps = rows.map(getTimestamp).filter(t => t > 0);
    if (timestamps.length === 0) return;

    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const nowApprox = maxTs + 60;

    const slider = document.getElementById('hn-age-slider');
    if (!slider) return;
    slider.min = String(minTs);
    slider.max = String(maxTs);
    slider.value = String(maxTs);

    function formatAgo(ts) {
      const mins = Math.round((nowApprox - ts) / 60);
      if (mins < 60) return `${mins} min ago`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `${hours} hr ago`;
      return `${Math.round(hours / 24)} day ago`;
    }

    document.getElementById('hn-lbl-old').textContent = formatAgo(minTs);

    const display = document.getElementById('hn-slider-display');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      if (val >= maxTs) {
        display.textContent = 'No highlight';
        rows.forEach(tr => tr.classList.remove('hn-new-comment'));
      } else {
        display.textContent = `Newer than: ${formatAgo(val)}`;
        rows.forEach(tr => {
          tr.classList.toggle('hn-new-comment', getTimestamp(tr) > val);
        });
      }
    });
  }

  // ── Collapse bars ──────────────────────────────────────────────────────────

  function hideNativeToggles() {
    const style = document.createElement('style');
    style.textContent = 'a.togg { display: none !important; }';
    document.head.appendChild(style);
  }

  let collapseOverlay = null;

  function buildCollapseOverlay(rows) {
    if (!collapseOverlay) {
      collapseOverlay = document.createElement('div');
      collapseOverlay.id = 'hn-collapse-overlay';
      document.body.appendChild(collapseOverlay);
    }

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const BAR_W = 6;
    const GAP = 4;
    const MARGIN = 4;

    // Read phase: measure all rows in one pass before touching the DOM.
    // Interleaving reads with DOM writes causes a forced reflow per bar.
    const specs = [];
    rows.forEach((tr, i) => {
      const subtreeIdxs = getSubtreeIndices(rows, i);
      if (subtreeIdxs.length === 0) return;

      const isCollapsed = tr.classList.contains('hn-collapsed');
      const trRect = tr.getBoundingClientRect();
      const topY = trRect.top + scrollY;

      let botY;
      if (isCollapsed) {
        botY = topY + Math.max(trRect.height - 18, 10);
      } else {
        let lastVisible = tr;
        for (const j of subtreeIdxs) {
          if (!rows[j].classList.contains('hn-hidden')) lastVisible = rows[j];
        }
        botY = lastVisible.getBoundingClientRect().bottom + scrollY;
      }

      const height = botY - topY;
      if (height < 4) return;

      const indCell = tr.querySelector('td.ind');
      if (!indCell) return;
      const left = indCell.getBoundingClientRect().right + scrollX - BAR_W - GAP;

      specs.push({ i, isCollapsed, topY: topY + MARGIN, left, height: height - MARGIN * 2, count: subtreeIdxs.length });
    });

    // Write phase: build and insert all bars at once.
    const fragment = document.createDocumentFragment();
    specs.forEach(({ i, isCollapsed, topY, left, height, count }) => {
      const bar = document.createElement('div');
      bar.className = 'hn-cbar' + (isCollapsed ? ' hn-collapsed' : '');
      bar.style.cssText = `top:${topY}px;left:${left}px;height:${height}px`;
      bar.title = isCollapsed
        ? `Expand ${count} comment${count !== 1 ? 's' : ''}`
        : 'Collapse thread';

      if (isCollapsed) {
        const lbl = document.createElement('span');
        lbl.className = 'hn-cbar-count';
        lbl.textContent = `+${count}`;
        bar.appendChild(lbl);
      }

      bar.addEventListener('click', () => toggleCollapse(rows, i));
      fragment.appendChild(bar);
    });

    collapseOverlay.innerHTML = '';
    collapseOverlay.appendChild(fragment);
  }

  function toggleCollapse(rows, rootIdx) {
    const rootTr = rows[rootIdx];
    const rootDepth = getDepth(rootTr);
    const nowCollapsed = !rootTr.classList.contains('hn-collapsed');
    rootTr.classList.toggle('hn-collapsed', nowCollapsed);
    for (let j = rootIdx + 1; j < rows.length; j++) {
      if (getDepth(rows[j]) > rootDepth) rows[j].classList.toggle('hn-hidden', nowCollapsed);
      else break;
    }
    setTimeout(() => buildCollapseOverlay(rows), 30);
  }

  function initCollapseRebuild(rows) {
    // Bars are in document coordinates so scroll needs no rebuild.
    // Debounce resize since layout geometry changes but events fire rapidly.
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => buildCollapseOverlay(rows), 150);
    });
  }

  // ── Parent tooltip ─────────────────────────────────────────────────────────

  let tooltipEl = null;
  let tooltipHideTimer = null;

  const TOOLTIP_LINKS = new Set(['parent', 'prev', 'next']);

  function isTooltipLink(el) {
    return el.tagName === 'A'
      && !!el.closest('.navs')
      && TOOLTIP_LINKS.has(el.textContent.trim());
  }

  function showParentTooltip(link) {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const targetRow = document.getElementById(href.slice(1));
    if (!targetRow) return;

    const innerTable = targetRow.querySelector('table');
    if (!innerTable) return;

    const clone = innerTable.cloneNode(true);
    clone.querySelector('.reply')?.remove();
    const img = clone.querySelector('td.ind img');
    if (img) img.width = 0;

    tooltipEl.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'hn-tooltip-label';
    label.textContent = link.textContent.trim() + ' comment';
    tooltipEl.appendChild(label);
    tooltipEl.appendChild(clone);

    // Cap height at half the viewport before measuring, so positioning is correct.
    tooltipEl.style.maxHeight = `${Math.floor(window.innerHeight / 2)}px`;
    tooltipEl.style.left = '-9999px';
    tooltipEl.style.top  = '-9999px';
    tooltipEl.classList.add('hn-visible');

    const r  = link.getBoundingClientRect();
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const G  = 8;

    let top  = r.bottom + G;
    if (top + th > vh - G) top = r.top - th - G;
    let left = r.left;
    if (left + tw > vw - G) left = vw - tw - G;
    if (left < G) left = G;

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top  = `${top}px`;
  }

  function initTooltip() {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'hn-parent-tooltip';
    document.body.appendChild(tooltipEl);

    document.addEventListener('mouseover', (e) => {
      if (!isTooltipLink(e.target)) return;
      clearTimeout(tooltipHideTimer);
      showParentTooltip(e.target);
    });

    document.addEventListener('mouseout', (e) => {
      if (!isTooltipLink(e.target)) return;
      tooltipHideTimer = setTimeout(() => {
        tooltipEl.classList.remove('hn-visible');
      }, 80);
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  // HN pre-collapses some comments. Adopt them into our state so the overlay
  // renders a pill and our toggle handles expand/collapse correctly.
  function normalizeHnCollapsed(rows) {
    // Read all offsets in one pass to avoid layout thrashing.
    const heights = rows.map(tr => tr.offsetHeight);
    rows.forEach((tr, i) => {
      if (heights[i] === 0) return; // already hidden — child of a collapsed parent
      const subtreeIdxs = getSubtreeIndices(rows, i);
      if (subtreeIdxs.length === 0) return;
      if (heights[subtreeIdxs[0]] === 0) {
        tr.classList.add('hn-collapsed');
        subtreeIdxs.forEach(j => rows[j].classList.add('hn-hidden'));
      }
    });
  }

  async function init() {
    const prefs = await loadPrefs();
    createPanel();
    applyDark(prefs.darkMode);
    // Anchor the absolute overlay to the document, not the viewport
    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    const rows = getCommentRows();
    if (rows.length > 0) {
      hideNativeToggles();
      normalizeHnCollapsed(rows);
      initSlider(rows);
      buildCollapseOverlay(rows);
      initCollapseRebuild(rows);
      initTooltip();
    }
    document.body.dataset.hnEnhancer = 'ready';
  }

  // Guard covers dynamic injection in tests (document_idle guarantees DOM in production)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
