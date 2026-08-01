// hn-enhancer/content.js
(function hnEnhancer() {
  'use strict';

  async function init() {
    document.body.dataset.hnEnhancer = 'ready';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
