// Shared studio helpers for exportable widgets (scatterplot, Velma fraud
// demo, future ones). The core idea: the live bundle styles are the ONLY
// source of truth — the standalone HTML export is assembled at export time
// by collecting the widget-scoped rules from document.styleSheets and
// resolving the design-system tokens they use into a baked block. There is
// no hand-maintained embed stylesheet to keep in sync.

// ── Downloads ───────────────────────────────────────────────────────────

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(payload, filename) {
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    filename
  );
}

// ── Fetch helpers ───────────────────────────────────────────────────────

export async function fetchText(path) {
  const response = await fetch(new URL(path, window.location.origin));

  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

// Inline a font file as a data: URL for the standalone export.
export async function fetchFontDataUrl(path) {
  const response = await fetch(new URL(path, window.location.origin));

  if (!response.ok) throw new Error(`Could not load ${path}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:font/woff2;base64,${btoa(binary)}`;
}

// ── Live-CSS collection ─────────────────────────────────────────────────

// Every class name present in a mounted widget's DOM — the natural scope
// list for collectScopedCss. States toggled at runtime are covered by the
// caller's `prefixes` (e.g. ".vf-"), since state classes share the widget's
// naming prefixes or attach to classes already in the resting DOM.
export function domClassTokens(root) {
  const tokens = new Set();

  [root, ...root.querySelectorAll("*")].forEach((el) => {
    el.classList.forEach((name) => tokens.add(`.${name}`));
  });
  return [...tokens];
}

function ruleMatches(selectorText, regex) {
  return regex.test(selectorText);
}

function collectRule(rule, regex, out) {
  if (rule.selectorText !== undefined) {
    // Style rule; its cssText already carries any nested rules.
    if (ruleMatches(rule.selectorText, regex)) out.push(rule.cssText);
    return;
  }
  if (rule.cssRules && rule.cssRules.length) {
    // Grouping rule (@media, @supports, @container, @layer): keep the
    // wrapper only around the children that match.
    const inner = [];

    [...rule.cssRules].forEach((child) => collectRule(child, regex, inner));
    if (!inner.length) return;

    const head = rule.cssText.slice(0, rule.cssText.indexOf("{")).trim();

    out.push(`${head} {\n${inner.join("\n")}\n}`);
  }
}

// Collect every top-level rule from the page's stylesheets whose selector
// mentions one of the given class tokens (exact class, word-bounded) or
// starts with one of the prefixes (e.g. ".vf-").
export function collectScopedCss({ classes = [], prefixes = [] } = {}) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = [
    ...classes.map((c) => `${escape(c)}(?![\\w-])`),
    ...prefixes.map((p) => `${escape(p)}[\\w-]+`),
  ];
  const regex = new RegExp(parts.join("|"));
  const out = [];

  [...document.styleSheets].forEach((sheet) => {
    let rules;

    try {
      rules = sheet.cssRules;
    } catch {
      return; // cross-origin sheet (e.g. Google Fonts)
    }
    [...rules].forEach((rule) => collectRule(rule, regex, out));
  });
  return out.join("\n\n");
}

// Custom properties the collected CSS consumes but does not define come
// from the design system's cascade. Bake their computed values (taken from
// the live element, so theme classes like `dark-mode` are respected) into
// one block under `scope`. Properties that resolve empty (e.g. per-element
// inline vars) are left alone.
export function resolveTokenBlock(el, cssText, scope) {
  const defined = new Set(
    [...cssText.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])
  );
  const used = new Set(
    [...cssText.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1])
  );
  const style = getComputedStyle(el);
  const lines = [];

  [...used].sort().forEach((name) => {
    if (defined.has(name)) return;

    const value = style.getPropertyValue(name).trim();

    if (value) lines.push(`  ${name}: ${value};`);
  });
  return lines.length ? `${scope} {\n${lines.join("\n")}\n}` : "";
}

// ── Export document assembly ────────────────────────────────────────────

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Full standalone document: the DS sans (ABC Areal, inlined as a data: URL
// so the export needs no network), collected CSS, body markup, optional
// inline JSON data and classic script.
export async function buildExportDocument({
  title,
  css,
  bodyHtml,
  jsonId,
  jsonData,
  inlineJs,
}) {
  const sansDataUrl = await fetchFontDataUrl(
    "/assets/fonts/ABCArealVariable.woff2"
  );
  const jsonBlock = jsonData
    ? `  <script type="application/json" id="${jsonId}">
${JSON.stringify(jsonData, null, 2).replaceAll("</", "<\\/")}
  </script>
`
    : "";
  const jsBlock = inlineJs
    ? `  <script>
${inlineJs.replaceAll("</script>", "<\\/script>")}
  </script>
`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
@font-face {
  font-family: "ABC Areal";
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  src: url("${sansDataUrl}") format("woff2");
}
body {
  margin: 0;
  font-family: "ABC Areal", system-ui, sans-serif;
}
${css}
  </style>
</head>
<body>
${bodyHtml}
${jsonBlock}${jsBlock}</body>
</html>
`;
}

// ── JSON import plumbing ────────────────────────────────────────────────

// Wire the standard studio buttons: a visible Import button proxying a
// hidden file input; `apply` gets the parsed JSON and may throw.
export function bindJsonImport(button, fileInput, apply, invalidMessage) {
  if (!button || !fileInput) return;

  button.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    if (!file) return;
    file.text().then((text) => {
      try {
        apply(JSON.parse(text));
      } catch (error) {
        window.alert(error.message || invalidMessage);
      } finally {
        fileInput.value = "";
      }
    });
  });
}
