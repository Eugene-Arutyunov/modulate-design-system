(function () {
  "use strict";

  function formatRgb(color) {
    var m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return "rgb(" + m[1] + ", " + m[2] + ", " + m[3] + ")";
    var s = color.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (s) {
      return "rgb(" +
        Math.round(parseFloat(s[1]) * 255) + ", " +
        Math.round(parseFloat(s[2]) * 255) + ", " +
        Math.round(parseFloat(s[3]) * 255) + ")";
    }
    return color;
  }

  function parseRgb(color) {
    var m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  }

  function isDarkBg(rgb) {
    var l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    var max = Math.max(rgb[0], rgb[1], rgb[2]);
    var min = Math.min(rgb[0], rgb[1], rgb[2]);
    var lhsl = (max + min) / 2;
    var s;
    if (max === min) s = 0;
    else if (lhsl > 127.5) s = (max - min) / (510 - max - min);
    else s = (max - min) / (max + min);
    var threshold = s > 0.5 ? 140 : 160;
    return l < threshold;
  }

  /* Walk all stylesheets for tokens whose name matches prefix + dash,
     defined under :root (no theme-scoped variants). Preserves declaration order. */
  function collectTokens(prefix) {
    var fullPrefix = "--m__" + prefix + "-";
    var seen = new Set();
    var result = [];

    for (var i = 0; i < document.styleSheets.length; i++) {
      var sheet = document.styleSheets[i];
      var rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        if (rule.type !== 1) continue;
        var sel = rule.selectorText || "";
        if (sel.indexOf(":root") === -1) continue;
        if (sel.indexOf(".light") !== -1) continue;
        if (sel.indexOf(".dark") !== -1) continue;
        for (var k = 0; k < rule.style.length; k++) {
          var prop = rule.style[k];
          if (prop.indexOf(fullPrefix) !== 0) continue;
          if (seen.has(prop)) continue;
          seen.add(prop);
          var raw = rule.style.getPropertyValue(prop).trim();
          var short = prop.slice("--m__".length);
          result.push({ name: prop, short: short, raw: raw });
        }
      }
    }
    return result;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* --- Renderers --- */

  function renderSwatch(container, tokens) {
    var groupKey = function (short) {
      var i = short.lastIndexOf("-");
      if (i === -1) return short;
      var tail = short.slice(i + 1);
      return /^\d+$/.test(tail) ? short.slice(0, i) : short;
    };
    var order = ["color-white", "color-gray", "color-slate", "color-blue", "color-azure", "color-purple", "color-red", "color-orange", "color-yellow", "color-green", "color-emerald", "color-pink"];
    var cmp = function (a, b) {
      var ai = order.indexOf(a), bi = order.indexOf(b);
      if (ai === -1) ai = 999;
      if (bi === -1) bi = 999;
      return ai - bi || a.localeCompare(b);
    };

    var groups = new Map();
    tokens.forEach(function (t) {
      var g = groupKey(t.short);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(t);
    });

    var probe = el("span");
    probe.style.display = "none";
    document.body.appendChild(probe);

    Array.from(groups.keys()).sort(cmp).forEach(function (g) {
      var items = groups.get(g);
      items.sort(function (a, b) {
        return a.short.localeCompare(b.short, undefined, { numeric: true });
      });

      var group = el("div", "guide-tokens__group");
      group.appendChild(el("h4", "guide-tokens__group-label", g.replace(/^color-/, "")));

      var grid = el("div", "guide-tokens__plates");
      items.forEach(function (t) {
        var plate = el("button", "guide-tokens__plate guide-tokens__plate--swatch");
        plate.type = "button";
        plate.style.backgroundColor = "var(" + t.name + ")";

        probe.style.backgroundColor = "var(" + t.name + ")";
        var resolved = getComputedStyle(probe).backgroundColor;
        var rgbStr = formatRgb(resolved);
        var parsed = parseRgb(resolved);
        plate.style.color = parsed && isDarkBg(parsed) ? "#fff" : "#1e1e23";
        if (parsed && parsed[0] >= 250 && parsed[1] >= 250 && parsed[2] >= 250) {
          plate.classList.add("guide-tokens__plate--light");
        }

        plate.appendChild(el("span", "guide-tokens__plate-name", t.short.replace(/^color-/, "")));
        plate.appendChild(el("span", "guide-tokens__plate-value", rgbStr));

        plate.addEventListener("click", function () {
          navigator.clipboard.writeText("var(" + t.name + ")");
          var flash = el("span", "guide-tokens__plate-flash", "var(" + t.name + ")");
          plate.appendChild(flash);
          flash.addEventListener("animationend", function () { flash.remove(); });
        });

        grid.appendChild(plate);
      });
      group.appendChild(grid);
      container.appendChild(group);
    });

    probe.remove();
  }

  function renderSquare(container, tokens) {
    var list = el("div", "guide-tokens__rows");
    renderTextHeader(list);

    tokens.forEach(function (t) {
      var row = el("div", "guide-tokens__row");

      var label = el("span", "guide-tokens__row-label");
      label.appendChild(el("code", "accent", t.name));
      row.appendChild(label);

      var plate = el("div", "guide-tokens__radius-sample");
      plate.style.borderRadius = "var(" + t.name + ")";
      row.appendChild(plate);

      row.appendChild(el("span", "guide-tokens__row-value", t.raw));

      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderControlPadding(container, tokens) {
    var list = el("div", "guide-tokens__rows");

    var header = el("div", "guide-tokens__row guide-tokens__row--control-padding guide-tokens__row--header");
    header.appendChild(el("span", "guide-tokens__row-header", "Token"));
    header.appendChild(el("span", "guide-tokens__row-header", "Sample"));
    header.appendChild(el("span", "guide-tokens__row-header", "Value"));
    list.appendChild(header);

    tokens.forEach(function (t) {
      var row = el("div", "guide-tokens__row guide-tokens__row--control-padding");

      var label = el("span", "guide-tokens__row-label");
      label.appendChild(el("code", "accent", t.name));
      row.appendChild(label);

      var box = el("div", "guide-tokens__control-sample");
      box.style.padding = "var(" + t.name + ")";
      box.appendChild(el("span", "guide-tokens__control-sample-content"));
      row.appendChild(box);

      row.appendChild(el("span", "guide-tokens__row-value", t.raw));

      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderSpace(container, tokens) {
    var list = el("div", "guide-tokens__space-stack");
    tokens.forEach(function (t) {
      var item = el("div", "guide-tokens__space-item");
      var sizeMod = t.short.replace(/^space-/, "").toUpperCase();

      var label = el("div", "guide-tokens__space-item-label");
      label.appendChild(el("code", null, ".m__space." + sizeMod.toLowerCase()));
      label.appendChild(el("span", "guide-tokens__row-value", t.raw));
      item.appendChild(label);

      var box = el("div", "m__space " + sizeMod);
      box.style.backgroundColor = "var(--m__bg-surface)";
      item.appendChild(box);
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  function renderBorderWidth(container, tokens) {
    var list = el("div", "guide-tokens__space-stack");
    tokens.forEach(function (t) {
      var item = el("div", "guide-tokens__space-item");

      var label = el("div", "guide-tokens__space-item-label");
      label.appendChild(el("code", "accent", t.name));
      label.appendChild(el("span", "guide-tokens__row-value", t.raw));
      item.appendChild(label);

      var line = el("div", "guide-tokens__border-line");
      line.style.height = "var(" + t.name + ")";
      item.appendChild(line);

      list.appendChild(item);
    });
    container.appendChild(list);
  }

  function renderTextHeader(list) {
    var header = el("div", "guide-tokens__row guide-tokens__row--header");
    header.appendChild(el("span", "guide-tokens__row-header", "Token"));
    header.appendChild(el("span", "guide-tokens__row-header", "Sample"));
    header.appendChild(el("span", "guide-tokens__row-header", "Value"));
    list.appendChild(header);
  }

  function appendTextRow(list, t, sampleText, sampleStyle) {
    var row = el("div", "guide-tokens__row");

    var label = el("span", "guide-tokens__row-label");
    label.appendChild(el("code", "accent", t.name));
    row.appendChild(label);

    var sample = el("span", "guide-tokens__text-sample", sampleText);
    Object.keys(sampleStyle).forEach(function (k) { sample.style[k] = sampleStyle[k]; });
    row.appendChild(sample);

    row.appendChild(el("span", "guide-tokens__row-value", t.raw));

    list.appendChild(row);
  }

  var FONT_SIZE_SAMPLE = {
    "font-size-display": "Display heading",
    "font-size-xxxl": "Huge heading",
    "font-size-xxl": "Large heading",
    "font-size-xl": "Medium heading",
    "font-size-l": "Small heading",
    "font-size-m": "Body text",
    "font-size-mono": "Code snippet",
    "font-size-s": "Caption",
    "font-size-xs": "Fine print"
  };

  var FONT_SIZE_ORDER = [
    "font-size-display",
    "font-size-xxxl",
    "font-size-xxl",
    "font-size-xl",
    "font-size-l",
    "font-size-m",
    "font-size-mono",
    "font-size-s",
    "font-size-xs"
  ];

  function renderTextSize(container, tokens) {
    var list = el("div", "guide-tokens__rows");
    renderTextHeader(list);
    var ordered = tokens.slice().sort(function (a, b) {
      var ai = FONT_SIZE_ORDER.indexOf(a.short);
      var bi = FONT_SIZE_ORDER.indexOf(b.short);
      if (ai === -1) ai = 999;
      if (bi === -1) bi = 999;
      return ai - bi;
    });
    ordered.forEach(function (t) {
      var sampleText = FONT_SIZE_SAMPLE[t.short] || "Aa";
      appendTextRow(list, t, sampleText, { fontSize: "var(" + t.name + ")" });
    });
    container.appendChild(list);
  }

  var FONT_WEIGHT_SAMPLE = {
    "font-weight-regular": "Regular",
    "font-weight-medium": "Medium",
    "font-weight-bold": "Bold"
  };

  function renderTextWeight(container, tokens) {
    var list = el("div", "guide-tokens__rows");
    renderTextHeader(list);
    tokens.forEach(function (t) {
      var sampleText = FONT_WEIGHT_SAMPLE[t.short] || "Aa";
      appendTextRow(list, t, sampleText, {
        fontWeight: "var(" + t.name + ")",
        fontSize: "var(--m__font-size-l)"
      });
    });
    container.appendChild(list);
  }

  var FONT_FAMILY_SAMPLE = {
    "font-family-sans": "Inter",
    "font-family-gothic": "CoFo Gothic",
    "font-family-semi-mono": "CoFo Sans Semi Mono",
    "font-family-mono": "CoFo Sans Mono"
  };

  function renderTextFamily(container, tokens) {
    var list = el("div", "guide-tokens__rows");
    renderTextHeader(list);
    tokens.forEach(function (t) {
      var sampleText = FONT_FAMILY_SAMPLE[t.short] || "Aa Bb 123";
      appendTextRow(list, t, sampleText, { fontFamily: "var(" + t.name + ")" });
    });
    container.appendChild(list);
  }

  function renderDuration(container, tokens) {
    var list = el("div", "guide-tokens__rows");
    tokens.forEach(function (t) {
      var row = el("div", "guide-tokens__row guide-tokens__row--anim");

      var track = el("div", "guide-tokens__bar-track");
      var fill = el("div", "guide-tokens__bar-fill guide-tokens__bar-fill--anim");
      fill.style.transitionDuration = "var(" + t.name + ")";
      fill.style.transitionTimingFunction = "var(--m__easing-base)";
      track.appendChild(fill);
      row.appendChild(track);

      row.appendChild(el("span", "guide-tokens__row-label", t.short));
      row.appendChild(el("span", "guide-tokens__row-value", t.raw));

      row.addEventListener("mouseenter", function () { fill.classList.add("is-active"); });
      row.addEventListener("mouseleave", function () { fill.classList.remove("is-active"); });

      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderEasing(container, tokens) {
    var list = el("div", "guide-tokens__rows");
    tokens.forEach(function (t) {
      var row = el("div", "guide-tokens__row guide-tokens__row--anim");

      var track = el("div", "guide-tokens__bar-track");
      var fill = el("div", "guide-tokens__bar-fill guide-tokens__bar-fill--anim");
      fill.style.transitionDuration = "1s";
      fill.style.transitionTimingFunction = "var(" + t.name + ")";
      track.appendChild(fill);
      row.appendChild(track);

      row.appendChild(el("span", "guide-tokens__row-label", t.short));
      row.appendChild(el("span", "guide-tokens__row-value", t.raw));

      row.addEventListener("mouseenter", function () { fill.classList.add("is-active"); });
      row.addEventListener("mouseleave", function () { fill.classList.remove("is-active"); });

      list.appendChild(row);
    });
    container.appendChild(list);
  }

  var renderers = {
    swatch: renderSwatch,
    square: renderSquare,
    space: renderSpace,
    "border-width": renderBorderWidth,
    "control-padding": renderControlPadding,
    "text-size": renderTextSize,
    "text-weight": renderTextWeight,
    "text-family": renderTextFamily,
    duration: renderDuration,
    easing: renderEasing,
  };

  function init() {
    var sections = document.querySelectorAll("[data-tokens-prefix]");
    sections.forEach(function (section) {
      var prefix = section.dataset.tokensPrefix;
      var renderType = section.dataset.tokensRender || "bar";
      var renderer = renderers[renderType];
      if (!renderer) return;
      var tokens = collectTokens(prefix);
      if (!tokens.length) return;
      renderer(section, tokens);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
