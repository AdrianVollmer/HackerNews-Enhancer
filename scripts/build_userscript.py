#!/usr/bin/env python3
"""Build hn-enhancer.user.js from the compiled extension files."""

import json
import sys
from pathlib import Path

root = Path(__file__).parent.parent


def build(out_path: Path = root / "dist" / "hn-enhancer.user.js") -> None:
    manifest = json.loads((root / "hn-enhancer/manifest.json").read_text())
    css = (root / "hn-enhancer/styles.css").read_text()
    early = (root / "hn-enhancer/early.js").read_text()
    content = (root / "hn-enhancer/content.js").read_text()

    header = f"""\
// ==UserScript==
// @name         HN Enhancer
// @namespace    https://github.com/AdrianVollmer/HackerNews-Enhancer
// @version      {manifest['version']}
// @description  {manifest['description']}
// @match        *://news.ycombinator.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==""".strip()

    # json.dumps() gives a properly escaped JS string literal for the CSS.
    preamble = f"""\
(function () {{
  'use strict';

  // Apply dark mode before first paint to avoid flash
{early}
  // Inject styles
  const _hnStyle = document.createElement('style');
  _hnStyle.textContent = {json.dumps(css)};
  (document.head || document.documentElement).appendChild(_hnStyle);
}})();"""

    # content.js already contains its own DOMContentLoaded guard
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n\n".join([header, preamble, content]))
    print(f"Written {out_path}")


if __name__ == "__main__":
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "hn-enhancer.user.js")
