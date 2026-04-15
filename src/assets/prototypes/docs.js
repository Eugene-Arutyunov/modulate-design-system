/**
 * Documentation page client logic.
 * Loads model list from static JSON, renders sidebar with status tags,
 * handles Quickstart / API Spec tab switching.
 * All data files live under /assets/prototypes/data/ and require no backend.
 */

/** @type {Map<string, object>} */
const docsModelsById = new Map();
let selectedModelUuid = null;
let activeTab = "quickstart";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadModels() {
  const list = document.getElementById("docs-model-list");
  try {
    const resp = await fetch("/assets/prototypes/data/models.json");
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
  // Group all models by nav_group, preserving original order
  const groups = [];
  const groupIndex = new Map();
  for (const m of models) {
    const key = m.nav_group ?? "";
    if (!groupIndex.has(key)) {
      groupIndex.set(key, groups.length);
      groups.push({ label: key, models: [] });
    }
    groups[groupIndex.get(key)].models.push(m);
  }

  groups.forEach(({ label, models: groupModels }, i) => {
    if (i > 0) {
      const spacer = document.createElement("div");
      spacer.className = "m__space XS";
      list.appendChild(spacer);
    }
    const group = document.createElement("div");
    group.className = "docs-model-nav__group";
    groupModels.forEach((m, j) => {
      group.appendChild(createModelItem(m, j === 0 ? label : null));
    });
    list.appendChild(group);
  });

}

function createModelItem(model, groupLabel = null) {
  const btn = document.createElement("button");
  btn.className = "docs-model-nav__link";
  btn.dataset.modelUuid = model.model_uuid;
  const iconId = model.model_type === "streaming" ? "streaming" : "batch";
  const labelHtml = groupLabel
    ? `<span class="docs-model-nav__group-label">${escapeHtml(groupLabel)}</span>`
    : "";
  btn.innerHTML = `${labelHtml}<span class="docs-model-nav__item-row">
    <svg viewBox="0 0 32 32" aria-hidden="true"><use href="#${iconId}"></use></svg>
    <span>${escapeHtml(model.nav_label ?? model.model_display_label)}</span>
  </span>`;
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
  const m = docsModelsById.get(uuid);
  if (m) {
    document.getElementById("docs-model-name").textContent =
      m.model_display_label;
    document.getElementById("docs-model-description").textContent =
      m.description;
  }
  document.getElementById("docs-placeholder").hidden = true;
  document.getElementById("docs-panel").hidden = false;
  renderTab(uuid);
}

async function renderTab(uuid) {
  const content = document.getElementById("docs-doc-content");
  content.innerHTML = '<div class="docs-loading">Loading…</div>';
  try {
    switch (activeTab) {
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

async function renderApiDocs(uuid, content) {
  const model = docsModelsById.get(uuid);
  if (!model) {
    content.innerHTML = '<div class="docs-loading">Model not found.</div>';
    return;
  }
  const resp = await fetch(
    `/assets/prototypes/data/model-docs/${model.model_identifier}/openapi.yaml`,
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
    `/assets/prototypes/data/model-docs/${model.model_identifier}/quickstart.md`,
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
      html += `<div class="docs-quickstart-content">${tmp.innerHTML}</div>`;
    } else {
      html += `<div><pre><code>${escapeHtml(md)}</code></pre></div>`;
    }
  } else {
    html += '<div class="docs-loading">Failed to load quickstart.</div>';
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
