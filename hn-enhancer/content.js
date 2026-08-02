// hn-enhancer/content.js
(function hnEnhancer() {
  'use strict';

  // async: will await browser.storage.local.get() in later tasks
  async function init() {
    document.body.dataset.hnEnhancer = 'ready';
  }

  // Guard covers dynamic injection in tests (document_idle guarantees DOM in production)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
