# HN Enhancer

A Firefox extension that improves the Hacker News reading experience.

## Features

**Dark theme** — toggle between light and dark mode from the settings panel. Your preference is saved across page loads.

**Comment age highlighter** — a slider lets you highlight comments newer than a chosen threshold. Move it left to highlight progressively more recent comments; at the rightmost position nothing is highlighted.

**Collapse bars** — the native `[–]` toggle is replaced with a full-height clickable bar on the left edge of each comment thread. When a thread is collapsed, the bar shrinks to a pill and shows a `+N` count of hidden comments. Click the pill to expand.

**Parent comment tooltip** — hovering over a `parent` link shows the referenced comment in a floating card, so you can read context without scrolling up. Only works for on-page parents; cross-page links are silently ignored.

## Installation

### Temporary load via about:debugging (any Firefox, no signing required)

This bypasses signature verification entirely. The extension is active until you restart Firefox.

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on...**
4. Select `hn-enhancer/manifest.json`

Repeat after each restart.

### Permanent installation (Firefox Developer Edition or Nightly only)

Standard Firefox release enforces extension signing even when `xpinstall.signatures.required` is toggled in `about:config` — that setting is locked in release builds. Developer Edition and Nightly are the only builds where it takes effect.

1. Download [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) or Nightly
2. In `about:config`, set `xpinstall.signatures.required` to `false`
3. Build the zip with `manifest.json` at the root:
   ```bash
   cd hn-enhancer && zip -r ../hn-enhancer.zip .
   ```
4. Go to `about:addons` → gear icon → **Install Add-on From File...**
5. Select `hn-enhancer.zip`

### Packaging as a signed extension

To install permanently in standard Firefox, you need to sign the extension through Mozilla's Add-on Developer Hub or use `web-ext`:

```bash
npm install -g web-ext
cd hn-enhancer
web-ext sign --api-key=<your-key> --api-secret=<your-secret>
```

See the [web-ext documentation](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) for details.

## Development

No build step required — plain JS and CSS.

Run the test suite (requires Python and `uv`):

```bash
cd /workspace
uv run --with pytest-playwright pytest tests/ -v
```
