const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT_DIR, "_site");
const HTML_INPUT = path.join(BUILD_DIR, "online-docs", "prosocial", "index.html");
const CSS_INPUT = path.join(BUILD_DIR, "bundle.css");
const FONTS_SOURCE_DIR = path.join(ROOT_DIR, "src", "assets", "fonts");
const OUTPUT_DIR = path.join(ROOT_DIR, "dist-publish", "prosocial-single");
const HTML_OUTPUT = path.join(OUTPUT_DIR, "prosocial.html");
const FONTS_OUTPUT_DIR = path.join(OUTPUT_DIR, "fonts");

function ensureExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
}

function escapeStyleEndTag(css) {
  return css.replace(/<\/style/gi, "<\\/style");
}

function collectFontFilesFromCss(css) {
  const fonts = new Set();
  const regex = /url\((['"]?)fonts\/([^'")]+)\1\)/gi;
  let match = regex.exec(css);

  while (match) {
    fonts.add(match[2]);
    match = regex.exec(css);
  }

  return [...fonts].sort();
}

function copyFonts(fontFiles) {
  fs.mkdirSync(FONTS_OUTPUT_DIR, { recursive: true });

  fontFiles.forEach((fontFile) => {
    const sourcePath = path.join(FONTS_SOURCE_DIR, fontFile);
    const outputPath = path.join(FONTS_OUTPUT_DIR, fontFile);
    ensureExists(sourcePath);
    fs.copyFileSync(sourcePath, outputPath);
  });
}

function inlineCss(html, css) {
  const styleTag = `<style>\n${escapeStyleEndTag(css)}\n</style>`;
  const stylesheetRegex = /<link\s+rel=["']stylesheet["']\s+href=["']\/bundle\.css["']\s*\/?>/i;

  if (!stylesheetRegex.test(html)) {
    throw new Error('Could not find <link rel="stylesheet" href="/bundle.css" /> in HTML');
  }

  return html
    .replace(stylesheetRegex, styleTag)
    .replace(/<link\s+rel=["']shortcut icon["'][^>]*>\s*/i, "");
}

function runBuildIfNeeded() {
  if (process.argv.includes("--skip-build")) {
    return;
  }

  execSync("npm run build", { cwd: ROOT_DIR, stdio: "inherit" });
}

function main() {
  runBuildIfNeeded();

  ensureExists(HTML_INPUT);
  ensureExists(CSS_INPUT);

  const html = fs.readFileSync(HTML_INPUT, "utf8");
  const css = fs.readFileSync(CSS_INPUT, "utf8");
  const inlinedHtml = inlineCss(html, css);
  const fontFiles = collectFontFilesFromCss(css);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(HTML_OUTPUT, inlinedHtml, "utf8");
  copyFonts(fontFiles);

  console.log("Created standalone export:");
  console.log(`- HTML: ${HTML_OUTPUT}`);
  console.log(`- Fonts: ${FONTS_OUTPUT_DIR}`);
  console.log(`- Copied font files: ${fontFiles.length}`);
}

main();
