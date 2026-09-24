import { ScatterPlot, createVendorsLegend } from "./scatterplot.js";
import {
  bindJsonImport,
  buildExportDocument,
  collectScopedCss,
  domClassTokens,
  downloadBlob,
  downloadJson,
  resolveTokenBlock,
} from "../widget-studio/widget-studio.js";
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

// Container width, not viewport: in screenshot mode the frame carries the
// chosen width, so the mobile config kicks in exactly when the mobile
// styles do.
function isMobileLayout() {
  return (wrapper?.clientWidth || window.innerWidth) <= MOBILE_BREAKPOINT;
}

function activeConfig() {
  return isMobileLayout() && configMobile ? configMobile : config;
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

  bindJsonImport(
    document.querySelector("[data-scatter-import]"),
    document.querySelector("[data-scatter-import-input]"),
    applyImport,
    "Invalid scatterplot JSON"
  );
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

async function buildExportHtml() {
  if (!wrapper) throw new Error("Scatterplot not ready");

  // Embed is always responsive geometry — screenshot settings stay in JSON only.
  const wasMode = STATE.mode;
  if (wasMode === "screenshot") {
    STATE.mode = "responsive";
    render();
  }

  // The export CSS is collected from the live stylesheets (single source):
  // every rule touching the widget's classes, plus the design-system tokens
  // they consume, baked as computed values.
  const css = collectScopedCss({
    classes: domClassTokens(wrapper),
    prefixes: [".scatterplot", ".vendor-"],
  });
  const tokens = resolveTokenBlock(wrapper, css, ".scatterplot-embed");

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

  // The export is a static clone — no scripts, no data payload. The
  // `scatterplot-studio` class on the wrapper activates the collected
  // live rules (they are scoped to it on the site).
  const html = await buildExportDocument({
    title: meta.title || "Scatterplot",
    css: `${tokens}\n\n${css}`,
    bodyHtml: `  <div class="scatterplot-embed scatterplot-studio">
${clone.outerHTML}
  </div>`,
  });

  if (wasMode === "screenshot") {
    STATE.mode = "screenshot";
    render();
  }

  return html;
}

async function exportHtml() {
  downloadBlob(
    new Blob([await buildExportHtml()], { type: "text/html" }),
    "conv-scatter.html"
  );
}

// Exposed for the export smoke-test harness.
export { buildExportHtml };

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
