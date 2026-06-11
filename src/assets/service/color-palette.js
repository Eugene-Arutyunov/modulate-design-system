(function () {
  "use strict";

  function formatRgb(color) {
    var m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return "rgb(" + m[1] + ", " + m[2] + ", " + m[3] + ")";

    var s = color.match(
      /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/
    );
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
    return l < 130;
  }

  /* Palette is theme-independent — collect once. */
  function collectPaletteByValue() {
    var byRgb = new Map();
    var probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);

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
          if (prop.indexOf("--m__color-") !== 0) continue;
          probe.style.backgroundColor = "var(" + prop + ")";
          var resolved = getComputedStyle(probe).backgroundColor;
          var rgb = formatRgb(resolved);
          if (!byRgb.has(rgb)) {
            byRgb.set(rgb, prop.replace("--m__color-", ""));
          }
        }
      }
    }
    probe.remove();
    return byRgb;
  }

  var paletteByRgb = null;
  var entries = [];

  function refreshEntry(entry) {
    var bgRaw = getComputedStyle(entry.plate).backgroundColor;
    var rgb = formatRgb(bgRaw);
    entry.rgb = rgb;
    entry.btn.textContent = rgb;

    var parsed = parseRgb(bgRaw);
    if (parsed) {
      entry.plate.style.color = isDarkBg(parsed)
        ? "var(--m__color-white)"
        : "var(--m__color-gray-950)";
    }

    var name = paletteByRgb.get(rgb);
    if (name) {
      if (!entry.label) {
        entry.label = document.createElement("span");
        entry.label.className = "guide-color-plate__token";
        entry.plate.insertBefore(entry.label, entry.btn);
      }
      entry.label.textContent = name;
    } else if (entry.label) {
      entry.label.remove();
      entry.label = null;
    }
  }

  function refreshAll() {
    entries.forEach(refreshEntry);
  }

  function initPlates() {
    var plates = document.querySelectorAll(".guide-color-plate");
    if (!plates.length) return;

    paletteByRgb = collectPaletteByValue();

    plates.forEach(function (plate) {
      var btn = plate.querySelector(".guide-color-plate__value");
      if (!btn) return;

      var entry = {
        plate: plate,
        btn: btn,
        label: plate.querySelector(".guide-color-plate__token"),
        rgb: "",
      };
      entries.push(entry);

      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(entry.rgb);

        var flash = document.createElement("span");
        flash.className = "guide-color-plate__flash";
        flash.textContent = entry.rgb;
        btn.appendChild(flash);
        flash.addEventListener("animationend", function () {
          flash.remove();
        });
      });

      refreshEntry(entry);
    });

    /* Re-read computed values when theme class flips on <body>. */
    var observer = new MutationObserver(refreshAll);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlates);
  } else {
    initPlates();
  }
})();
