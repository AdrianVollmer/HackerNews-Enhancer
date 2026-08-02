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

  // ── Init ───────────────────────────────────────────────────────────────────

  async function init() {
    const prefs = await loadPrefs();
    createPanel();
    applyDark(prefs.darkMode);
    document.body.dataset.hnEnhancer = 'ready';
  }

  // Guard covers dynamic injection in tests (document_idle guarantees DOM in production)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
