const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(
  ROOT_DIR,
  "src",
  "assets",
  "images",
  "svg-icons-3d-source",
);
const FALLBACK_SOURCE_DIR = path.join(
  ROOT_DIR,
  "src",
  "assets",
  "images",
  "svg-icons-source",
);
const LAYERS_DIR = path.join(SOURCE_DIR, "layers");
const OUTPUT_FILE = path.join(
  ROOT_DIR,
  "src",
  "assets",
  "service",
  "icon-3d",
  "icons.json",
);

const REQUIRED_ICON_IDS = [
  "ai-music",
  "deepfake",
  "language",
  "music",
  "redaction",
  "stt-med",
  "transcript",
  "velma",
];

const FILL_MAP = new Map([
  ["#000", "currentColor"],
  ["#000000", "currentColor"],
  ["black", "currentColor"],
  ["#fff", "var(--m__bg-surface)"],
  ["#ffffff", "var(--m__bg-surface)"],
  ["white", "var(--m__bg-surface)"],
  ["#fbb03b", "var(--m__color-yellow-500)"],
  ["#ffc800", "var(--m__color-yellow-500)"],
  ["#a778fa", "var(--m__color-purple-400)"],
  ["#7a5af8", "var(--m__color-purple-400)"],
  ["#ff3654", "var(--m__color-red-500)"],
  ["#e5484d", "var(--m__color-red-500)"],
]);

const SHAPE_TAGS = "path|rect|circle|ellipse|polygon|polyline|line";

function getAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`${name}\\s*=\\s*(['"])(.*?)\\1`, "i"));
  return match ? match[2] : "";
}

function parseDeclarations(block) {
  const declarations = {};
  const declarationRegex = /([\w-]+)\s*:\s*([^;]+)\s*;?/g;
  let match;

  while ((match = declarationRegex.exec(block))) {
    declarations[match[1].toLowerCase()] = match[2].trim();
  }

  return declarations;
}

function parseClassStyles(svgContent) {
  const classStyles = {};
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;

  while ((styleMatch = styleRegex.exec(svgContent))) {
    const cssText = styleMatch[1];
    const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
    let ruleMatch;

    while ((ruleMatch = ruleRegex.exec(cssText))) {
      const selectors = ruleMatch[1]
        .split(",")
        .map((selector) => selector.trim())
        .filter((selector) => selector.startsWith("."));
      const declarations = parseDeclarations(ruleMatch[2]);

      selectors.forEach((selector) => {
        const className = selector.slice(1);
        classStyles[className] = {
          ...(classStyles[className] || {}),
          ...declarations,
        };
      });
    }
  }

  return classStyles;
}

function resolveClassFill(attributes, classStyles) {
  const classNames = getAttribute(attributes, "class")
    .split(/\s+/)
    .filter(Boolean);
  let fill = getAttribute(attributes, "fill");

  classNames.forEach((className) => {
    if (classStyles[className] && classStyles[className].fill) {
      fill = classStyles[className].fill;
    }
  });

  return fill;
}

function normalizeFill(fill) {
  if (!fill) {
    return "currentColor";
  }

  const cleanFill = fill.trim();
  const mappedFill = FILL_MAP.get(cleanFill.toLowerCase());

  return mappedFill || cleanFill;
}

function sanitizeAttributes(attributes) {
  return attributes
    .replace(/\/\s*$/g, "")
    .replace(
      /\s+(?:class|id|data-name|data-3d-layer|style|xmlns(?::\w+)?|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit)=(['"])(.*?)\1/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function readLayerConfig(id) {
  const filePath = path.join(LAYERS_DIR, `${id}.layers.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getExplicitLayer(attributes) {
  const rawLayer = getAttribute(attributes, "data-3d-layer");

  if (!rawLayer) {
    return null;
  }

  const layer = Number(rawLayer);

  if (!Number.isFinite(layer)) {
    throw new Error(`Invalid data-3d-layer value: ${rawLayer}`);
  }

  return layer;
}

function buildIcon(id, filePath, sourceType) {
  const svgContent = fs.readFileSync(filePath, "utf8");
  const svgMatch = svgContent.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);

  if (!svgMatch) {
    throw new Error(`Invalid SVG file: ${filePath}`);
  }

  const viewBox = getAttribute(svgMatch[1], "viewBox");

  if (!viewBox) {
    throw new Error(`SVG file is missing viewBox: ${filePath}`);
  }

  const classStyles = parseClassStyles(svgContent);
  const layerConfig = readLayerConfig(id);
  const shapeLayers = layerConfig && Array.isArray(layerConfig.shapeLayers)
    ? layerConfig.shapeLayers
    : [];
  const shapeLayerSpans = layerConfig && Array.isArray(layerConfig.shapeLayerSpans)
    ? layerConfig.shapeLayerSpans
    : [];
  const parts = [];
  const shapeRegex = new RegExp(
    `<(${SHAPE_TAGS})\\b([^>]*)\\/?>(?:\\s*<\\/\\1>)?`,
    "gi",
  );
  let match;
  let shapeIndex = 0;

  while ((match = shapeRegex.exec(svgMatch[2]))) {
    const tagName = match[1].toLowerCase();
    const attributes = match[2];
    const fill = normalizeFill(resolveClassFill(attributes, classStyles));

    if (fill.toLowerCase() === "none") {
      continue;
    }

    const explicitLayer = getExplicitLayer(attributes);
    const layer = explicitLayer ?? shapeLayers[shapeIndex] ?? 0;
    const layerSpan = shapeLayerSpans[shapeIndex] ?? 1;
    const cleanedAttributes = sanitizeAttributes(attributes);
    const svg = cleanedAttributes
      ? `<${tagName} fill="#000" ${cleanedAttributes} />`
      : `<${tagName} fill="#000" />`;

    parts.push({
      layer,
      layerSpan,
      fill,
      svg,
    });
    shapeIndex += 1;
  }

  if (!parts.length) {
    throw new Error(`SVG file has no supported shapes: ${filePath}`);
  }

  return {
    id,
    sourceType,
    viewBox,
    parts,
  };
}

function getIconSource(id) {
  const primary = path.join(SOURCE_DIR, `${id}.svg`);

  if (fs.existsSync(primary)) {
    return {
      filePath: primary,
      sourceType: "3d-source",
    };
  }

  const fallback = path.join(FALLBACK_SOURCE_DIR, `${id}.svg`);

  if (fs.existsSync(fallback)) {
    return {
      filePath: fallback,
      sourceType: "flat-fallback",
    };
  }

  throw new Error(`Missing 3D icon source and fallback source for ${id}`);
}

function main() {
  const icons = {};

  REQUIRED_ICON_IDS.forEach((id) => {
    const source = getIconSource(id);
    icons[id] = buildIcon(id, source.filePath, source.sourceType);
  });

  const manifest = {
    generatedBy: "scripts/generate-icon-3d-manifest.js",
    icons,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Generated 3D icon manifest with ${Object.keys(icons).length} icons.`);
}

main();
