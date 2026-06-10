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

  function initPlates() {
    var plates = document.querySelectorAll(".guide-color-plate");
    if (!plates.length) return;

    var paletteByRgb = collectPaletteByValue();

    plates.forEach(function (plate) {
      var btn = plate.querySelector(".guide-color-plate__value");
      if (!btn) return;

      var computed = getComputedStyle(plate).backgroundColor;
      var rgb = formatRgb(computed);
      btn.textContent = rgb;

      var paletteName = paletteByRgb.get(rgb);
      if (paletteName) {
        var label = plate.querySelector(".guide-color-plate__token");
        if (!label) {
          label = document.createElement("span");
          label.className = "guide-color-plate__token";
          plate.insertBefore(label, btn);
        }
        label.textContent = paletteName;
      }

      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(rgb);

        var flash = document.createElement("span");
        flash.className = "guide-color-plate__flash";
        flash.textContent = rgb;
        btn.appendChild(flash);
        flash.addEventListener("animationend", function () {
          flash.remove();
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlates);
  } else {
    initPlates();
  }
})();
