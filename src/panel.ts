function loadPrefs(): { darkMode: boolean } {
  return { darkMode: localStorage.getItem("hn-dark") === "1" };
}

function savePref(key: string, value: boolean): void {
  if (key === "darkMode") localStorage.setItem("hn-dark", value ? "1" : "0");
}

export function applyDark(on: boolean): void {
  document.documentElement.classList.toggle("hn-dark", on);
  document.body.classList.toggle("hn-dark", on);
  const toggle = document.getElementById("hn-theme-toggle");
  if (toggle) toggle.classList.toggle("hn-on", on);
}

export function createPanel(): void {
  const prefs = loadPrefs();

  const btn = document.createElement("div");
  btn.id = "hn-ext-btn";
  btn.title = "HN Enhancer";
  btn.textContent = "⚙";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("hn-ext-panel")?.classList.toggle("hn-open");
  });
  document.body.appendChild(btn);

  const panel = document.createElement("div");
  panel.id = "hn-ext-panel";

  const themeSection = document.createElement("div");
  themeSection.innerHTML = `
      <div class="hn-panel-label">Appearance</div>
      <div class="hn-panel-row">
        <span>Dark theme</span>
        <div class="hn-pill-toggle" id="hn-theme-toggle"></div>
      </div>`;
  panel.appendChild(themeSection);

  const sliderSection = document.createElement("div");
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

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target as Node) && e.target !== btn) {
      panel.classList.remove("hn-open");
    }
  });

  document.getElementById("hn-theme-toggle")!.addEventListener("click", () => {
    const isDark = document.body.classList.contains("hn-dark");
    applyDark(!isDark);
    savePref("darkMode", !isDark);
  });

  applyDark(prefs.darkMode);
}
