// Velma Fraud Demo studio — page chrome around the widget: mounts it with
// the default data, JSON import/export (same envelope pattern as the
// scatterplot studio), and the self-contained HTML export for Webflow.
// The widget itself is a classic script (window.VelmaFraudWidget) so the
// export can inline it verbatim; the export CSS is collected from the live
// stylesheets at export time (single source — no embed stylesheet).

import { velmaFraudData } from "./velma-fraud-config.js";
import {
  bindJsonImport,
  buildExportDocument,
  collectScopedCss,
  domClassTokens,
  downloadBlob,
  downloadJson,
  fetchFontDataUrl,
  fetchText,
  resolveTokenBlock,
} from "../widget-studio/widget-studio.js";

const DATA_FORMAT = "modulate-velma-fraud-demo";
const DATA_VERSION = 1;

let data = structuredClone(velmaFraudData);
let widget = null;

const root = document.querySelector("[data-vf-widget]");

function mountWidget() {
  if (!root || !window.VelmaFraudWidget) return;
  if (widget) widget.destroy();
  widget = window.VelmaFraudWidget.mount(root, data);
}

function exportData() {
  downloadJson(
    {
      format: DATA_FORMAT,
      version: DATA_VERSION,
      ...structuredClone(data),
    },
    "velma-fraud-demo.json"
  );
}

function applyImport(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid Velma fraud demo JSON");
  }
  if (parsed.format && parsed.format !== DATA_FORMAT) {
    throw new Error(`Unexpected format: ${parsed.format}`);
  }
  if (!parsed.meta || !Array.isArray(parsed.transcript)) {
    throw new Error("JSON must include meta and transcript");
  }

  data = {
    meta: { ...velmaFraudData.meta, ...parsed.meta },
    transcript: structuredClone(parsed.transcript),
    signals: structuredClone(parsed.signals || []),
    verdict: parsed.verdict
      ? structuredClone(parsed.verdict)
      : structuredClone(velmaFraudData.verdict),
    actions: structuredClone(parsed.actions || []),
  };
  mountWidget();
}

// The export CSS: every live rule that touches the widget's DOM (its class
// inventory plus the runtime-state prefixes), then the design-system tokens
// those rules consume, baked as computed dark-theme values from the mounted
// widget.
function collectExportCss() {
  const widgetEl = root?.querySelector(".velma-fraud-widget") ?? root;
  const css = collectScopedCss({
    classes: domClassTokens(root),
    // .vf-/.velma-fraud cover the widget's own runtime-state classes;
    // .emotion- covers the emotion classes that land on clips and bubbles
    // during playback (absent from the resting DOM).
    prefixes: [".vf-", ".velma-fraud", ".emotion-"],
  });
  const tokens = resolveTokenBlock(widgetEl, css, ".velma-fraud-widget");

  return `${tokens}\n\n${css}`;
}

async function buildExportHtml() {
  if (!root) throw new Error("Widget not mounted");

  const widgetJs = await fetchText(
    "/assets/service/velma-fraud/velma-fraud-widget.js"
  );
  // The semi-mono is the widget's brand voice (eyebrows, tags) — inline it
  // into the export as a data: URL so the standalone page keeps it; the
  // Areal sans itself is inlined by buildExportDocument.
  const fontDataUrl = await fetchFontDataUrl(
    "/assets/fonts/ABCArealSemiMonoVariable.woff2"
  );
  const fontFace = `@font-face {
  font-family: "ABC Areal Semi Mono";
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  src: url("${fontDataUrl}") format("woff2");
}`;

  return buildExportDocument({
    title: data.meta.title || "Velma Fraud Demo",
    css: `${fontFace}\n${collectExportCss()}`,
    bodyHtml: `  <div class="velma-fraud-embed">
    <div class="velma-fraud-frame">
      <div data-vf-widget></div>
    </div>
  </div>`,
    jsonId: "velma-fraud-data",
    jsonData: {
      format: DATA_FORMAT,
      version: DATA_VERSION,
      ...structuredClone(data),
    },
    inlineJs: widgetJs,
  });
}

async function exportHtml() {
  downloadBlob(
    new Blob([await buildExportHtml()], { type: "text/html" }),
    "velma-fraud-demo.html"
  );
}

function bindControls() {
  document.querySelector("[data-vf-replay]")?.addEventListener("click", () => {
    widget?.replay();
  });

  document
    .querySelector("[data-vf-export]")
    ?.addEventListener("click", exportData);

  document
    .querySelector("[data-vf-export-html]")
    ?.addEventListener("click", () => {
      exportHtml().catch((error) => {
        window.alert(error.message || "HTML export failed");
      });
    });

  bindJsonImport(
    document.querySelector("[data-vf-import]"),
    document.querySelector("[data-vf-import-input]"),
    applyImport,
    "Invalid Velma fraud demo JSON"
  );
}

bindControls();
mountWidget();

// Exposed for the export smoke-test harness.
export { buildExportHtml, collectExportCss };
