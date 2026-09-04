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
  const themeLabel = document.createElement("div");
  themeLabel.className = "hn-panel-label";
  themeLabel.textContent = "Appearance";
  const themeRow = document.createElement("div");
  themeRow.className = "hn-panel-row";
  const themeSpan = document.createElement("span");
  themeSpan.textContent = "Dark theme";
  const themeToggle = document.createElement("div");
  themeToggle.className = "hn-pill-toggle";
  themeToggle.id = "hn-theme-toggle";
  themeRow.append(themeSpan, themeToggle);
  themeSection.append(themeLabel, themeRow);
  panel.appendChild(themeSection);

  const sliderSection = document.createElement("div");
  const sliderLabel = document.createElement("div");
  sliderLabel.className = "hn-panel-label";
  sliderLabel.textContent = "Highlight newer than";
  const sliderInput = document.createElement("input");
  sliderInput.type = "range";
  sliderInput.id = "hn-age-slider";
  const sliderLabels = document.createElement("div");
  sliderLabels.className = "hn-slider-labels";
  const lblOld = document.createElement("span");
  lblOld.id = "hn-lbl-old";
  lblOld.textContent = "oldest";
  const lblNew = document.createElement("span");
  lblNew.id = "hn-lbl-new";
  lblNew.textContent = "newest";
  sliderLabels.append(lblOld, lblNew);
  const sliderDisplay = document.createElement("div");
  sliderDisplay.className = "hn-slider-value";
  sliderDisplay.id = "hn-slider-display";
  sliderDisplay.textContent = "No highlight";
  sliderSection.append(sliderLabel, sliderInput, sliderLabels, sliderDisplay);
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
