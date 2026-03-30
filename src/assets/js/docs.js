/**
 * Documentation page client logic.
 * Loads model list from static JSON, renders sidebar with status badges,
 * handles Overview / API Spec / Quickstart tab switching.
 * All data files live under /assets/data/ and require no backend.
 */

/** @type {Map<string, object>} */
const docsModelsById = new Map();
let selectedModelUuid = null;
let activeTab = "overview";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCost(n) {
  if (n < 0.001) return n.toFixed(5);
  if (n < 0.01) return n.toFixed(4);
  return n.toFixed(2);
}

function badgeClass(status) {
  if (status === "released") return "m__badge--released";
  if (status === "preview") return "m__badge--preview";
  return "";
}

async function loadModels() {
  const list = document.getElementById("docs-model-list");
  try {
    const resp = await fetch("/assets/data/models.json");
    if (!resp.ok) throw new Error("Failed");
    const { models } = await resp.json();
    docsModelsById.clear();
    for (const m of models) docsModelsById.set(m.model_uuid, m);
    renderModelList(models, list);
    const first = models.find((m) => m.status === "released") ?? models[0];
    if (first) selectModel(first.model_uuid);
  } catch {
    list.innerHTML = '<div class="docs-loading">Failed to load models.</div>';
  }
}

function renderModelList(models, list) {
  list.innerHTML = "";
  const released = models.filter((m) => m.status === "released");
  const preview = models.filter((m) => m.status !== "released");
  for (const m of released) list.appendChild(createModelItem(m));
  if (preview.length > 0) {
    const label = document.createElement("div");
    label.className = "docs-model-list__section-label";
    label.textContent = "Preview";
    list.appendChild(label);
    for (const m of preview) list.appendChild(createModelItem(m));
  }
}

function createModelItem(model) {
  const btn = document.createElement("button");
  btn.className = "nav-sidebar__link";
  btn.dataset.modelUuid = model.model_uuid;
  btn.innerHTML = `<span>${escapeHtml(model.model_display_label)}</span><span class="m__badge ${badgeClass(model.status)}">${escapeHtml(model.status)}</span>`;
  btn.addEventListener("click", () => selectModel(model.model_uuid));
  return btn;
}

function selectModel(uuid) {
  selectedModelUuid = uuid;
  document
    .querySelectorAll("#docs-model-list .nav-sidebar__link")
    .forEach((el) => {
      el.classList.toggle("active", el.dataset.modelUuid === uuid);
    });
  const model = docsModelsById.get(uuid);
  document.getElementById("docs-panel-title").textContent =
    model?.model_display_label ?? "";
  document.getElementById("docs-placeholder").hidden = true;
  document.getElementById("docs-panel").hidden = false;
  renderTab(uuid);
}

async function renderTab(uuid) {
  const content = document.getElementById("docs-doc-content");
  content.innerHTML = '<div class="docs-loading">Loading…</div>';
  try {
    switch (activeTab) {
      case "overview":
        renderOverview(uuid, content);
        break;
      case "api-docs":
        await renderApiDocs(uuid, content);
        break;
      case "quickstart":
        await renderQuickstart(uuid, content);
        break;
    }
  } catch {
    content.innerHTML =
      '<div class="docs-loading">Failed to load content.</div>';
  }
}

function renderOverview(uuid, content) {
  const m = docsModelsById.get(uuid);
  if (!m) {
    content.innerHTML = "";
    return;
  }
  const cost =
    m.cost_dollars_per_thousand_hours === 0
      ? "Free"
      : `$${formatCost(m.cost_dollars_per_thousand_hours / 1000)} per hour`;
  const featureRows = m.feature_costs
    .map(
      (fc) =>
        `<tr><th>${escapeHtml(fc.feature_name)}</th><td>$${formatCost(fc.cost_dollars_per_thousand_hours / 1000)} / hr</td></tr>`,
    )
    .join("");
  const formats =
    m.accepted_media_formats.length > 0
      ? m.accepted_media_formats
          .map((f) => `<code>${escapeHtml(f)}</code>`)
          .join(" ")
      : "—";
  content.innerHTML = `
    <table class="docs-overview-table">
      <tbody>
        <tr><th>Endpoint</th><td><code>${escapeHtml(m.api_url)}</code></td></tr>
        <tr><th>Model identifier</th><td><code>${escapeHtml(m.model_identifier)}</code></td></tr>
        <tr><th>Type</th><td>${escapeHtml(m.model_type)}</td></tr>
        <tr><th>Status</th><td><span class="m__badge ${badgeClass(m.status)}">${escapeHtml(m.status)}</span></td></tr>
        <tr><th>Description</th><td>${escapeHtml(m.description)}</td></tr>
        <tr><th>Accepted formats</th><td>${formats}</td></tr>
        <tr><th>Concurrency quota</th><td>${m.concurrency_quota.toLocaleString()} concurrent requests</td></tr>
        <tr><th>Monthly usage quota</th><td>${m.usage_quota.toLocaleString()} hours</td></tr>
        <tr><th>Cost</th><td>${cost}</td></tr>
        ${featureRows}
      </tbody>
    </table>`;
}

async function renderApiDocs(uuid, content) {
  const model = docsModelsById.get(uuid);
  if (!model) {
    content.innerHTML = '<div class="docs-loading">Model not found.</div>';
    return;
  }
  const resp = await fetch(
    `/assets/data/model-docs/${model.model_identifier}/openapi.yaml`,
  );
  if (!resp.ok) {
    content.innerHTML =
      '<div class="docs-loading">Failed to load API spec.</div>';
    return;
  }
  const yaml = await resp.text();
  const filename = `${model.model_identifier}-openapi.yaml`;
  content.innerHTML = `
    <div class="docs-code-block">
      <div class="docs-code-block__toolbar">
        <button class="m__button-secondary-compact" id="docs-download-btn">Download</button>
      </div>
      <pre><code>${escapeHtml(yaml)}</code></pre>
    </div>`;
  document.getElementById("docs-download-btn").addEventListener("click", () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function renderQuickstart(uuid, content) {
  const model = docsModelsById.get(uuid);
  if (!model) {
    content.innerHTML = '<div class="docs-loading">Model not found.</div>';
    return;
  }
  const resp = await fetch(
    `/assets/data/model-docs/${model.model_identifier}/quickstart.md`,
  );
  let html = "";
  if (resp.ok) {
    const md = await resp.text();
    // Model docs are Modulate-authored content, not user input, so XSS is not a concern here.
    const markedLib = window.marked;
    html += `<div class="docs-markdown m__text-content">${markedLib ? markedLib.parse(md) : `<pre><code>${escapeHtml(md)}</code></pre>`}</div>`;
  } else {
    html += '<div class="docs-loading">Failed to load quickstart.</div>';
  }
  const links = model.example_project_links ?? [];
  if (links.length > 0) {
    html +=
      '<div class="docs-markdown m__text-content"><h6>Example projects</h6><ul>';
    for (const l of links) {
      html += `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.title)}</a></li>`;
    }
    html += "</ul></div>";
  }
  content.innerHTML =
    html || '<div class="docs-loading">Failed to load quickstart.</div>';
  const hljs = window.hljs;
  if (hljs) {
    content.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }
}

function setupTabs() {
  document.querySelectorAll('[name="doc-tab"]').forEach((input) => {
    input.addEventListener("change", () => {
      activeTab = input.value;
      if (selectedModelUuid) renderTab(selectedModelUuid);
    });
  });
}

setupTabs();
loadModels();
