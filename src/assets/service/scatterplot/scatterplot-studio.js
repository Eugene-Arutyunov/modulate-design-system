import { ScatterPlot, createVendorsLegend } from "./scatterplot.js";
import {
  convScatterConfig,
  convScatterConfigMobile,
  convScatterMeta,
} from "./conv-scatter-config.js";

const DATA_FORMAT = "modulate-scatterplot";
const DATA_VERSION = 1;
const MOBILE_BREAKPOINT = 768;

const DEFAULT_STUDIO = {
  mode: "responsive",
  width: 1140,
  height: 400,
  labelFontSize: 0.875,
  pointSize: 0.875,
  axisFontSize: 0.8125,
};

const STATE = { ...DEFAULT_STUDIO };

let config = structuredClone(convScatterConfig);
let configMobile = structuredClone(convScatterConfigMobile);
let meta = { ...convScatterMeta };
let plot = null;

const stage = document.querySelector("[data-scatter-stage]");
const wrapper = document.querySelector("#scatterplot-1");
const aria = wrapper?.querySelector(".scatterplot-aria");
const titleEl = wrapper?.querySelector(".scatterplot-title");
const subtitleEl = wrapper?.querySelector(".scatterplot-subtitle");
const vendorsEl = wrapper?.querySelector(".vendors");

function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function activeConfig() {
  return isMobileViewport() && configMobile ? configMobile : config;
}

function applyMeta() {
  if (titleEl) {
    if (meta.title.includes("Accuracy vs. Cost")) {
      titleEl.innerHTML = meta.title.replace(
        "Accuracy vs. Cost",
        "<nobr>Accuracy vs. Cost</nobr>"
      );
    } else {
      titleEl.textContent = meta.title;
    }
  }
  if (subtitleEl) {
    subtitleEl.replaceChildren();
    subtitleEl.append(meta.subtitle || "", " ");
    if (meta.methodologyUrl) {
      const link = document.createElement("a");
      link.href = meta.methodologyUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.innerHTML = "Methodology&nbsp;↗";
      subtitleEl.append(link);
    }
  }

  const axisX = aria?.querySelector(".scatterplot-axis-label-x");
  const axisY = aria?.querySelector(".scatterplot-axis-label-y");
  if (axisX && meta.axisLabelX) axisX.textContent = meta.axisLabelX;
  if (axisY && meta.axisLabelY) axisY.textContent = meta.axisLabelY;
}

function applyTypographyVars() {
  if (!stage) return;
  if (STATE.mode === "screenshot") {
    stage.style.setProperty(
      "--scatterplot-label-font-size",
      `${STATE.labelFontSize}em`
    );
    stage.style.setProperty("--scatterplot-point-size", `${STATE.pointSize}em`);
    stage.style.setProperty(
      "--scatterplot-axis-font-size",
      `${STATE.axisFontSize}em`
    );
  } else {
    stage.style.removeProperty("--scatterplot-label-font-size");
    stage.style.removeProperty("--scatterplot-point-size");
    stage.style.removeProperty("--scatterplot-axis-font-size");
  }
}

function applyMode() {
  if (!stage || !wrapper || !aria) return;

  stage.dataset.mode = STATE.mode;
  document
    .querySelectorAll("[data-scatter-screenshot-only]")
    .forEach((el) => {
      el.hidden = STATE.mode !== "screenshot";
    });

  if (STATE.mode === "screenshot") {
    stage.style.setProperty("--scatter-stage-width", `${STATE.width}px`);
    wrapper.style.width = `${STATE.width}px`;
    aria.style.height = `${STATE.height}px`;
  } else {
    wrapper.style.width = "";
    aria.style.height = "";
    stage.style.removeProperty("--scatter-stage-width");
  }
}

function rebuildLegend() {
  if (!vendorsEl) return;
  vendorsEl.innerHTML = "";
  createVendorsLegend("#scatterplot-1 .vendors", activeConfig());
}

function render() {
  if (!aria) return;
  applyMeta();
  applyTypographyVars();
  applyMode();

  const nextConfig = activeConfig();
  if (!plot) {
    plot = new ScatterPlot(aria, nextConfig);
  } else {
    plot.config = nextConfig;
  }
  plot.createScatterPlot();
  rebuildLegend();
}

function syncControls() {
  document.querySelectorAll("[data-scatter-mode]").forEach((radio) => {
    radio.checked = radio.value === STATE.mode;
  });

  const map = {
    "[data-scatter-width]": STATE.width,
    "[data-scatter-height]": STATE.height,
    "[data-scatter-label-font]": STATE.labelFontSize,
    "[data-scatter-point-size]": STATE.pointSize,
    "[data-scatter-axis-font]": STATE.axisFontSize,
  };

  Object.entries(map).forEach(([selector, value]) => {
    const input = document.querySelector(selector);
    if (!input) return;
    input.value = value;
    const output = input.parentElement?.querySelector("output");
    if (output) output.value = value;
  });
}

function bindMode() {
  document.querySelectorAll("[data-scatter-mode]").forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      STATE.mode = radio.value;
      render();
    });
  });
}

function bindRange(selector, key, { asInt = false } = {}) {
  const input = document.querySelector(selector);
  if (!input) return;

  const syncOutput = () => {
    const output = input.parentElement?.querySelector("output");
    if (output) output.value = input.value;
  };

  const apply = () => {
    const raw = parseFloat(input.value);
    if (isNaN(raw)) return;
    STATE[key] = asInt ? Math.round(raw) : raw;
    syncOutput();
    render();
  };

  input.addEventListener("input", () => {
    const raw = parseFloat(input.value);
    if (!isNaN(raw)) {
      STATE[key] = asInt ? Math.round(raw) : raw;
    }
    syncOutput();
    render();
  });
  input.addEventListener("change", apply);
  syncOutput();
}

function bindExportImport() {
  document
    .querySelector("[data-scatter-export]")
    ?.addEventListener("click", exportData);
  document
    .querySelector("[data-scatter-export-html]")
    ?.addEventListener("click", () => {
      exportHtml().catch((error) => {
        window.alert(error.message || "HTML export failed");
      });
    });

  const button = document.querySelector("[data-scatter-import]");
  const fileInput = document.querySelector("[data-scatter-import-input]");
  if (!button || !fileInput) return;

  button.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        applyImport(JSON.parse(text));
      } catch (error) {
        window.alert(error.message || "Invalid scatterplot JSON");
      } finally {
        fileInput.value = "";
      }
    });
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function studioPayload() {
  // Screenshot sizing lives under studio.screenshot — not chart data.
  // Responsive mode ignores these; HTML export omits them.
  return {
    mode: STATE.mode,
    screenshot: {
      width: STATE.width,
      height: STATE.height,
      labelFontSize: STATE.labelFontSize,
      pointSize: STATE.pointSize,
      axisFontSize: STATE.axisFontSize,
    },
  };
}

function applyStudio(studio) {
  if (!studio || typeof studio !== "object") return;

  if (studio.mode === "responsive" || studio.mode === "screenshot") {
    STATE.mode = studio.mode;
  }

  const shot =
    studio.screenshot && typeof studio.screenshot === "object"
      ? studio.screenshot
      : studio;

  if ("width" in shot) STATE.width = shot.width;
  if ("height" in shot) STATE.height = shot.height;
  if ("labelFontSize" in shot) STATE.labelFontSize = shot.labelFontSize;
  if ("pointSize" in shot) STATE.pointSize = shot.pointSize;
  if ("axisFontSize" in shot) STATE.axisFontSize = shot.axisFontSize;
}

function exportData() {
  const payload = {
    format: DATA_FORMAT,
    version: DATA_VERSION,
    config,
    configMobile,
    meta: { ...meta },
    studio: studioPayload(),
  };
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    "conv-scatter.json"
  );
}

async function exportHtml() {
  if (!wrapper) throw new Error("Scatterplot not ready");

  const cssUrl = new URL(
    "/assets/service/scatterplot/scatterplot-embed.css",
    window.location.origin
  );
  const cssResponse = await fetch(cssUrl);
  if (!cssResponse.ok) {
    throw new Error("Could not load embed stylesheet");
  }
  const css = await cssResponse.text();

  // Embed is always responsive geometry — screenshot settings stay in JSON only.
  const wasMode = STATE.mode;
  if (wasMode === "screenshot") {
    STATE.mode = "responsive";
    render();
  }

  const clone = wrapper.cloneNode(true);
  clone.removeAttribute("id");
  clone.style.width = "";
  clone.style.removeProperty("--scatterplot-label-font-size");
  clone.style.removeProperty("--scatterplot-point-size");
  clone.style.removeProperty("--scatterplot-axis-font-size");
  const ariaClone = clone.querySelector(".scatterplot-aria");
  if (ariaClone) ariaClone.style.height = "";

  clone.querySelectorAll(".scatterplot-point-active").forEach((el) => {
    el.classList.remove("scatterplot-point-active");
  });
  clone.querySelectorAll(".scatterplot-point-label-active").forEach((el) => {
    el.classList.remove("scatterplot-point-label-active");
  });
  clone
    .querySelectorAll(
      ".scatterplot-axis-x-label, .scatterplot-axis-y-label, .scatterplot-axis-x-tick, .scatterplot-axis-y-tick"
    )
    .forEach((el) => el.remove());

  // Chart data only — no studio / screenshot settings.
  const dataPayload = {
    format: DATA_FORMAT,
    version: DATA_VERSION,
    config,
    configMobile,
    meta: { ...meta },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeAttr(meta.title || "Scatterplot")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
${css}
body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  background: #fff;
  color: rgb(20, 20, 50);
}
.scatterplot-embed .scatterplot-wrapper {
  font-family: Inter, system-ui, sans-serif;
}
  </style>
</head>
<body>
  <div class="scatterplot-embed">
${clone.outerHTML}
  </div>
  <script type="application/json" id="scatterplot-data">
${JSON.stringify(dataPayload, null, 2)}
  </script>
</body>
</html>
`;

  if (wasMode === "screenshot") {
    STATE.mode = "screenshot";
    render();
  }

  downloadBlob(new Blob([html], { type: "text/html" }), "conv-scatter.html");
}

function escapeAttr(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function applyImport(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid scatterplot JSON");
  }
  if (parsed.format && parsed.format !== DATA_FORMAT) {
    throw new Error(`Unexpected format: ${parsed.format}`);
  }
  if (!parsed.config || !Array.isArray(parsed.config.data)) {
    throw new Error("JSON must include config.data");
  }

  config = structuredClone(parsed.config);
  configMobile = parsed.configMobile
    ? structuredClone(parsed.configMobile)
    : null;

  if (parsed.meta && typeof parsed.meta === "object") {
    meta = {
      title: parsed.meta.title ?? meta.title,
      subtitle: parsed.meta.subtitle ?? meta.subtitle,
      methodologyUrl: parsed.meta.methodologyUrl ?? meta.methodologyUrl,
      methodologyLabel:
        parsed.meta.methodologyLabel ?? meta.methodologyLabel,
      axisLabelX: parsed.meta.axisLabelX ?? meta.axisLabelX,
      axisLabelY: parsed.meta.axisLabelY ?? meta.axisLabelY,
    };
  }

  applyStudio(parsed.studio);

  syncControls();
  render();
}

function init() {
  if (!wrapper || !aria || !stage) return;

  bindMode();
  bindRange("[data-scatter-width]", "width", { asInt: true });
  bindRange("[data-scatter-height]", "height", { asInt: true });
  bindRange("[data-scatter-label-font]", "labelFontSize");
  bindRange("[data-scatter-point-size]", "pointSize");
  bindRange("[data-scatter-axis-font]", "axisFontSize");
  bindExportImport();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(render, 100);
  });

  syncControls();
  render();
}

init();
