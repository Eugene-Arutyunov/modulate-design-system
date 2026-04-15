const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(
  ROOT_DIR,
  "src",
  "assets",
  "images",
  "svg-icons-source",
);
const OUTPUT_FILE = path.join(
  ROOT_DIR,
  "src",
  "includes",
  "service",
  "svg-icons-sprite.html",
);

// Icons that keep their original fill colors instead of using currentColor.
// These are typically brand/vendor logos that must render in their trademark colors.
const COLORED_ICONS = new Set(["google", "microsoft", "facebook"]);

const SHAPE_TAGS = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "line",
]);

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

function shouldDropShape(attributes, classStyles) {
  const explicitFill = getAttribute(attributes, "fill");
  const classNames = getAttribute(attributes, "class")
    .split(/\s+/)
    .filter(Boolean);

  let resolvedFill = explicitFill;

  classNames.forEach((className) => {
    if (classStyles[className] && classStyles[className].fill) {
      resolvedFill = classStyles[className].fill;
    }
  });

  return resolvedFill.toLowerCase() === "none";
}

// Monochrome: strip all color and editor attributes so the icon inherits currentColor.
function sanitizeAttributes(attributes) {
  return attributes
    .replace(
      /\s+(?:class|id|data-name|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|style|xmlns(?::\w+)?)=(['"])(.*?)\1/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

// Colored: resolve class-based fills to inline fill attributes, remove only editor junk.
function resolveColorAttributes(attributes, classStyles) {
  const classNames = getAttribute(attributes, "class")
    .split(/\s+/)
    .filter(Boolean);

  // Class fill overrides any inline fill
  let resolvedFill = getAttribute(attributes, "fill");
  classNames.forEach((className) => {
    if (classStyles[className] && classStyles[className].fill) {
      resolvedFill = classStyles[className].fill;
    }
  });

  // Remove editor junk and the existing fill (re-added below as resolved value)
  let cleaned = attributes
    .replace(
      /\s+(?:class|id|data-name|style|xmlns(?::\w+)?|fill)=(['"])(.*?)\1/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (resolvedFill) {
    cleaned = `fill="${resolvedFill}"${cleaned ? " " + cleaned : ""}`;
  }

  return cleaned;
}

function sanitizeInnerSvg(innerSvg, classStyles) {
  let cleaned = innerSvg
    .replace(/<defs[\s\S]*?<\/defs>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    .replace(/<desc[\s\S]*?<\/desc>/gi, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "");

  cleaned = cleaned.replace(
    /<(path|rect|circle|ellipse|polygon|polyline|line)\b([^>]*)\/>/gi,
    (fullMatch, tagName, attributes) => {
      if (shouldDropShape(attributes, classStyles)) {
        return "";
      }

      const sanitizedAttributes = sanitizeAttributes(attributes);
      return sanitizedAttributes
        ? `<${tagName} ${sanitizedAttributes} />`
        : `<${tagName} />`;
    },
  );

  cleaned = cleaned.replace(/<(g)\b([^>]*)>/gi, (fullMatch, tagName, attributes) => {
    const sanitizedAttributes = sanitizeAttributes(attributes);
    return sanitizedAttributes ? `<${tagName} ${sanitizedAttributes}>` : `<${tagName}>`;
  });

  return cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join("\n")
    .trim();
}

function sanitizeInnerSvgColored(innerSvg, classStyles) {
  let cleaned = innerSvg
    .replace(/<defs[\s\S]*?<\/defs>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    .replace(/<desc[\s\S]*?<\/desc>/gi, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "");

  cleaned = cleaned.replace(
    /<(path|rect|circle|ellipse|polygon|polyline|line)\b([^>]*)\/>/gi,
    (fullMatch, tagName, attributes) => {
      if (shouldDropShape(attributes, classStyles)) {
        return "";
      }

      const resolved = resolveColorAttributes(attributes, classStyles);
      return resolved ? `<${tagName} ${resolved} />` : `<${tagName} />`;
    },
  );

  cleaned = cleaned.replace(/<(g)\b([^>]*)>/gi, (fullMatch, tagName, attributes) => {
    const resolved = resolveColorAttributes(attributes, classStyles);
    return resolved ? `<${tagName} ${resolved}>` : `<${tagName}>`;
  });

  return cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join("\n")
    .trim();
}

function buildSymbol(fileName) {
  const id = path.basename(fileName, ".svg");
  const isColored = COLORED_ICONS.has(id);
  const filePath = path.join(SOURCE_DIR, fileName);
  const svgContent = fs.readFileSync(filePath, "utf8");
  const svgMatch = svgContent.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);

  if (!svgMatch) {
    throw new Error(`Invalid SVG file: ${fileName}`);
  }

  const svgAttributes = svgMatch[1];
  const innerSvg = svgMatch[2];
  const viewBox = getAttribute(svgAttributes, "viewBox");

  if (!viewBox) {
    throw new Error(`SVG file is missing viewBox: ${fileName}`);
  }

  const classStyles = parseClassStyles(svgContent);
  const sanitizedInnerSvg = isColored
    ? sanitizeInnerSvgColored(innerSvg, classStyles)
    : sanitizeInnerSvg(innerSvg, classStyles);

  const symbolAttrs = isColored
    ? `id="${id}" viewBox="${viewBox}"`
    : `id="${id}" viewBox="${viewBox}" fill="currentColor"`;

  return `  <symbol ${symbolAttrs}>\n${indentBlock(sanitizedInnerSvg, 4)}\n  </symbol>`;
}

function indentBlock(content, spaces) {
  const indent = " ".repeat(spaces);
  return content
    .split("\n")
    .map((line) => (line ? `${indent}${line}` : line))
    .join("\n");
}

function main() {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((fileName) => fileName.endsWith(".svg"))
    .sort();

  const symbols = files.map(buildSymbol).join("\n");
  const sprite = [
    "<!-- Generated by scripts/generate-svg-sprite.js. Do not edit directly. -->",
    '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position: absolute; width: 0; height: 0; overflow: hidden;">',
    symbols,
    "</svg>",
    "",
  ].join("\n");

  fs.writeFileSync(OUTPUT_FILE, sprite, "utf8");
  console.log(`Generated SVG sprite with ${files.length} icons.`);
}

main();
