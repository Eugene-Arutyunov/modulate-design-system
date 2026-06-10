(function () {
  "use strict";

  function collectPaletteTokens() {
    var tokens = new Map();
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
          if (prop.indexOf("--m__color-") === 0) {
            tokens.set(prop, rule.style.getPropertyValue(prop).trim());
          }
        }
      }
    }
    return tokens;
  }

  function parseRgb(value) {
    var m = value.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  }

  function isDark(rgb) {
    var l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return l < 130;
  }

  function shortName(varName) {
    return varName.replace("--m__color-", "");
  }

  function groupKey(short) {
    var dash = short.lastIndexOf("-");
    if (dash === -1) return short;
    var tail = short.slice(dash + 1);
    if (/^\d+$/.test(tail)) return short.slice(0, dash);
    return short;
  }

  var GROUP_ORDER = [
    "gray", "white", "navy", "blue", "purple",
    "red", "green", "yellow", "pink", "slate",
  ];

  function compareGroups(a, b) {
    var ai = GROUP_ORDER.indexOf(a);
    var bi = GROUP_ORDER.indexOf(b);
    if (ai === -1) ai = 999;
    if (bi === -1) bi = 999;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  }

  function init() {
    var container = document.querySelector(".guide-palette");
    if (!container) return;

    var tokens = collectPaletteTokens();
    if (!tokens.size) return;

    var groups = new Map();
    tokens.forEach(function (value, name) {
      var short = shortName(name);
      var g = groupKey(short);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push({ name: name, value: value, short: short });
    });

    var groupNames = Array.from(groups.keys()).sort(compareGroups);

    groupNames.forEach(function (g) {
      var items = groups.get(g);
      items.sort(function (a, b) {
        return a.short.localeCompare(b.short, undefined, { numeric: true });
      });

      var groupEl = document.createElement("div");
      groupEl.className = "guide-palette__group";

      var label = document.createElement("h4");
      label.className = "guide-palette__group-label";
      label.textContent = g;
      groupEl.appendChild(label);

      var grid = document.createElement("div");
      grid.className = "guide-palette__grid";

      items.forEach(function (item) {
        var plate = document.createElement("button");
        plate.type = "button";
        plate.className = "guide-palette__plate";
        plate.style.backgroundColor = "var(" + item.name + ")";

        var rgb = parseRgb(item.value);
        plate.style.color = (rgb && isDark(rgb)) ? "#fff" : "#1e1e23";

        var nameEl = document.createElement("span");
        nameEl.className = "guide-palette__name";
        nameEl.textContent = item.short;
        plate.appendChild(nameEl);

        var valueEl = document.createElement("span");
        valueEl.className = "guide-palette__value";
        valueEl.textContent = item.value;
        plate.appendChild(valueEl);

        plate.addEventListener("click", function () {
          navigator.clipboard.writeText("var(" + item.name + ")");
          var flash = document.createElement("span");
          flash.className = "guide-palette__flash";
          flash.textContent = "var(" + item.name + ")";
          plate.appendChild(flash);
          flash.addEventListener("animationend", function () {
            flash.remove();
          });
        });

        grid.appendChild(plate);
      });

      groupEl.appendChild(grid);
      container.appendChild(groupEl);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
