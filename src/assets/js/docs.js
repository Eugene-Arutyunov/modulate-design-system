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

function tagClass(status) {
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

  if (released.length > 0) {
    const group = document.createElement("div");
    group.className = "docs-model-nav__group";
    for (const m of released) group.appendChild(createModelItem(m));
    list.appendChild(group);
  }

  if (preview.length > 0) {
    const spacer = document.createElement("div");
    spacer.className = "m__space XS";
    list.appendChild(spacer);
    const label = document.createElement("div");
    label.className = "docs-model-nav__section-label";
    label.textContent = "Preview";
    list.appendChild(label);
    const group = document.createElement("div");
    group.className = "docs-model-nav__group";
    for (const m of preview) group.appendChild(createModelItem(m));
    list.appendChild(group);
  }
}

function createModelItem(model) {
  const btn = document.createElement("button");
  btn.className = "docs-model-nav__link";
  btn.dataset.modelUuid = model.model_uuid;
  btn.innerHTML = `<span>${escapeHtml(model.model_display_label)}</span>`;
  btn.addEventListener("click", () => selectModel(model.model_uuid));
  return btn;
}

function selectModel(uuid) {
  selectedModelUuid = uuid;
  document
    .querySelectorAll("#docs-model-list .docs-model-nav__link")
    .forEach((el) => {
      el.classList.toggle("active", el.dataset.modelUuid === uuid);
    });
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
        `<tr><td>${escapeHtml(fc.feature_name)}</td><td>$${formatCost(fc.cost_dollars_per_thousand_hours / 1000)} / hr</td></tr>`,
    )
    .join("");
  const formats =
    m.accepted_media_formats.length > 0
      ? m.accepted_media_formats
          .map((f) => `<code>${escapeHtml(f)}</code>`)
          .join(" ")
      : "—";
  content.innerHTML = `
    <div class="m__text-content">
      <table>
        <tbody>
          <tr><td>Endpoint</td><td><code>${escapeHtml(m.api_url)}</code></td></tr>
          <tr><td>Model identifier</td><td><code>${escapeHtml(m.model_identifier)}</code></td></tr>
          <tr><td>Type</td><td>${escapeHtml(m.model_type)}</td></tr>
          <tr><td>Status</td><td><span class="m__badge ${tagClass(m.status)}">${escapeHtml(m.status)}</span></td></tr>
          <tr><td>Accepted formats</td><td>${formats}</td></tr>
          <tr><td>Concurrency quota</td><td>${m.concurrency_quota.toLocaleString()} concurrent requests</td></tr>
          <tr><td>Monthly usage quota</td><td>${m.usage_quota.toLocaleString()} hours</td></tr>
          <tr><td>Cost</td><td>${cost}</td></tr>
          ${featureRows}
        </tbody>
      </table>
    </div>`;
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
    <div class="m__code-block">
      <div class="m__code-block__toolbar">
        <span>${escapeHtml(filename)}</span>
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
    if (markedLib) {
      const tmp = document.createElement("div");
      tmp.innerHTML = markedLib.parse(md);
      tmp.querySelector("h1, h2, h3, h4, h5, h6")?.remove();
      html += `<div class="m__text-content">${tmp.innerHTML}</div>`;
    } else {
      html += `<div class="m__text-content"><pre><code>${escapeHtml(md)}</code></pre></div>`;
    }
  } else {
    html += '<div class="docs-loading">Failed to load quickstart.</div>';
  }
  const links = model.example_project_links ?? [];
  if (links.length > 0) {
    html +=
      '<div class="m__text-content"><h6>Example projects</h6><ul>';
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
  document.getElementById("docs-panel")?.addEventListener("change", (e) => {
    if (e.target.matches('[name="doc-tab"]')) {
      activeTab = e.target.value;
      if (selectedModelUuid) renderTab(selectedModelUuid);
    }
  });
}

setupTabs();
loadModels();
