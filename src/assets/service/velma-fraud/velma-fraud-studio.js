// Velma Fraud Demo studio — page chrome around the widget: mounts it with
// the default data, JSON import/export (same envelope pattern as the
// scatterplot studio), and the self-contained HTML export for Webflow.
// The widget itself is a classic script (window.VelmaFraudWidget) so the
// export can inline it verbatim.

import { velmaFraudData } from "./velma-fraud-config.js";

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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportData() {
  const payload = {
    format: DATA_FORMAT,
    version: DATA_VERSION,
    ...structuredClone(data),
  };

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
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
    meterKeyframes: structuredClone(parsed.meterKeyframes || []),
  };
  mountWidget();
}

async function exportHtml() {
  const [css, widgetJs] = await Promise.all(
    [
      "/assets/service/velma-fraud/velma-fraud-embed.css",
      "/assets/service/velma-fraud/velma-fraud-widget.js",
    ].map(async (path) => {
      const response = await fetch(new URL(path, window.location.origin));

      if (!response.ok) throw new Error(`Could not load ${path}`);
      return response.text();
    })
  );

  const payload = {
    format: DATA_FORMAT,
    version: DATA_VERSION,
    ...structuredClone(data),
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.meta.title || "Velma Fraud Demo")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
}
${css}
  </style>
</head>
<body>
  <div class="velma-fraud-embed">
    <div class="velma-fraud-frame">
      <div data-vf-widget></div>
    </div>
  </div>
  <script type="application/json" id="velma-fraud-data">
${JSON.stringify(payload, null, 2).replaceAll("</", "<\\/")}
  </script>
  <script>
${widgetJs.replaceAll("</script>", "<\\/script>")}
  </script>
</body>
</html>
`;

  downloadBlob(new Blob([html], { type: "text/html" }), "velma-fraud-demo.html");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

  const button = document.querySelector("[data-vf-import]");
  const fileInput = document.querySelector("[data-vf-import-input]");

  if (!button || !fileInput) return;
  button.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    if (!file) return;
    file.text().then((text) => {
      try {
        applyImport(JSON.parse(text));
      } catch (error) {
        window.alert(error.message || "Invalid Velma fraud demo JSON");
      } finally {
        fileInput.value = "";
      }
    });
  });
}

bindControls();
mountWidget();
