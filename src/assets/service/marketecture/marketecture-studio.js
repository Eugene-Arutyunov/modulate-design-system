// Marketecture draft studio — the poster is static DOM, so the export is
// a clone of the live node (scatterplot pattern): embed CSS inlined, the
// semi-mono inlined as a data: URL, and the sprite symbols the poster
// references copied into the file so `<use href="#…">` keeps resolving.
// The active theme is baked in as a body class at click time.

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// The semi-mono (labels) and the gothic (title) are the poster's brand
// voices — inline both into the export as data: URLs so the standalone
// page keeps them (~60 KB each).
async function fetchFontDataUrl(path, label) {
  const response = await fetch(new URL(path, window.location.origin));

  if (!response.ok) throw new Error(`Could not load ${label}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:font/woff2;base64,${btoa(binary)}`;
}

// Subset of the site sprite: only the symbols the poster references.
function collectSpriteSymbols(poster) {
  const ids = new Set(
    [...poster.querySelectorAll("use")]
      .map((use) => use.getAttribute("href") || "")
      .filter((href) => href.startsWith("#"))
      .map((href) => href.slice(1))
  );
  const symbols = [...ids]
    .map((id) => document.getElementById(id)?.outerHTML)
    .filter(Boolean);

  if (symbols.length < ids.size) {
    throw new Error("Some sprite symbols were not found on the page");
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display: none" aria-hidden="true">${symbols.join(
    "\n"
  )}</svg>`;
}

async function exportHtml() {
  const poster = document.querySelector("[data-mk-poster]");

  if (!poster) throw new Error("Poster not found on the page");

  const cssResponse = await fetch(
    new URL(
      "/assets/service/marketecture/marketecture-embed.css",
      window.location.origin
    )
  );

  if (!cssResponse.ok) throw new Error("Could not load marketecture-embed.css");

  const css = await cssResponse.text();
  const [semiMonoDataUrl, gothicDataUrl] = await Promise.all([
    fetchFontDataUrl(
      "/assets/fonts/CoFoSansSemi-Mono-Regular.woff2",
      "CoFo Sans Semi Mono"
    ),
    fetchFontDataUrl("/assets/fonts/CoFoGothic-Bold.woff2", "CoFo Gothic"),
  ]);
  const sprite = collectSpriteSymbols(poster);
  const clone = poster.cloneNode(true);
  const dark = document.body.classList.contains("dark-mode");

  clone.removeAttribute("id");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Modulate Marketecture</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
body {
  margin: 0;
  padding: 2rem 1rem;
  background-color: var(--m__bg);
  display: grid;
  place-items: start center;
}
.marketecture {
  width: 100%;
  max-width: 1140px;
}
@font-face {
  font-family: "CoFo Sans Semi Mono";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("${semiMonoDataUrl}") format("woff2");
}
@font-face {
  font-family: "CoFo Gothic";
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url("${gothicDataUrl}") format("woff2");
}
${css}
  </style>
</head>
<body${dark ? ' class="dark-mode"' : ""}>
  ${sprite}
  ${clone.outerHTML}
</body>
</html>
`;

  downloadBlob(
    new Blob([html], { type: "text/html" }),
    "modulate-marketecture.html"
  );
}

document.querySelector("[data-mk-export-html]")?.addEventListener("click", () => {
  exportHtml().catch((error) => {
    window.alert(error.message || "HTML export failed");
  });
});

// Roadmap timeline: the slider steps through months; the poster's
// data-month attribute drives visibility of data-coming items via CSS,
// so an export clone bakes the chosen month.
const MONTHS = ["aug", "sep", "oct", "nov", "dec"];

document.querySelector("[data-mk-month]")?.addEventListener("input", (event) => {
  const month = MONTHS[Number(event.target.value)] || "aug";

  document.querySelector("[data-mk-poster]")?.setAttribute("data-month", month);
});
