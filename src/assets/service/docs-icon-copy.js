(function () {
  "use strict";

  function formatRgb(color) {
    var m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return "rgb(" + m[1] + ", " + m[2] + ", " + m[3] + ")";

    var s = color.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (s) {
      return (
        "rgb(" +
        Math.round(parseFloat(s[1]) * 255) +
        ", " +
        Math.round(parseFloat(s[2]) * 255) +
        ", " +
        Math.round(parseFloat(s[3]) * 255) +
        ")"
      );
    }

    return color;
  }

  var probeSvg;

  function getProbeSvg() {
    if (probeSvg) return probeSvg;

    probeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    probeSvg.setAttribute("aria-hidden", "true");
    probeSvg.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    document.body.appendChild(probeSvg);
    return probeSvg;
  }

  function resolvePaint(value, iconEl) {
    if (!value || value === "none" || value === "inherit") return value;
    if (value === "currentColor") {
      return formatRgb(getComputedStyle(iconEl).color);
    }
    if (value.indexOf("var(") !== -1) {
      var host = getProbeSvg();
      var probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      probe.setAttribute("fill", value);
      host.appendChild(probe);
      var resolved = formatRgb(getComputedStyle(probe).fill);
      probe.remove();
      return resolved;
    }
    if (value.indexOf("rgb") === 0 || value.indexOf("color(") === 0) {
      return formatRgb(value);
    }
    return value;
  }

  function applyResolvedPaints(root, iconEl) {
    var nodes = root.querySelectorAll("*");
    var i;
    for (i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.hasAttribute("fill")) {
        node.setAttribute(
          "fill",
          resolvePaint(node.getAttribute("fill"), iconEl)
        );
      }
      if (node.hasAttribute("stroke")) {
        node.setAttribute(
          "stroke",
          resolvePaint(node.getAttribute("stroke"), iconEl)
        );
      }
    }
  }

  function buildExportSvg(symbol, iconEl) {
    var viewBox = symbol.getAttribute("viewBox");
    if (!viewBox) viewBox = iconEl.getAttribute("viewBox") || "0 0 32 32";

    var exportSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    exportSvg.setAttribute("viewBox", viewBox);

    var symbolFill = symbol.getAttribute("fill");
    if (symbolFill) {
      exportSvg.setAttribute("fill", resolvePaint(symbolFill, iconEl));
    }

    var child = symbol.firstElementChild;
    while (child) {
      exportSvg.appendChild(child.cloneNode(true));
      child = child.nextElementSibling;
    }

    applyResolvedPaints(exportSvg, iconEl);
    return exportSvg;
  }

  function copySvgMarkup(svgString) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.write === "function" &&
      typeof ClipboardItem !== "undefined"
    ) {
      return navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([svgString], { type: "text/plain" }),
          "image/svg+xml": new Blob([svgString], { type: "image/svg+xml" }),
        }),
      ]);
    }

    return navigator.clipboard.writeText(svgString);
  }

  function animateIconCopy(iconEl) {
    if (iconEl.classList.contains("is-flying")) return;

    iconEl.classList.add("is-flying");
    iconEl.addEventListener(
      "animationend",
      function onFlyEnd(event) {
        if (event.animationName !== "docs-icon-fly-away") return;

        iconEl.removeEventListener("animationend", onFlyEnd);
        iconEl.classList.remove("is-flying");
        iconEl.classList.add("is-returning");
        iconEl.addEventListener(
          "animationend",
          function onReturnEnd(returnEvent) {
            if (returnEvent.animationName !== "docs-icon-return") return;

            iconEl.removeEventListener("animationend", onReturnEnd);
            iconEl.classList.remove("is-returning");
          }
        );
      }
    );
  }

  function getIconId(item) {
    var useEl = item.querySelector("use");
    if (!useEl) return null;

    var href =
      useEl.getAttribute("href") || useEl.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (!href || href.charAt(0) !== "#") return null;

    return href.slice(1);
  }

  function copyIconFromItem(item) {
    var iconId = getIconId(item);
    if (!iconId) return;

    var symbol = document.getElementById(iconId);
    if (!symbol || symbol.localName !== "symbol") return;

    var iconEl = item.querySelector(".docs-icon-row__icon");
    var exportSvg = buildExportSvg(symbol, iconEl);
    var svgString = new XMLSerializer().serializeToString(exportSvg);

    copySvgMarkup(svgString).then(function () {
      animateIconCopy(iconEl);
    });
  }

  function initIconCopy() {
    var items = document.querySelectorAll(".docs-icon-row__item");
    items.forEach(function (item) {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute(
        "aria-label",
        "Copy SVG for " + (getIconId(item) || "icon")
      );

      item.addEventListener("click", function () {
        copyIconFromItem(item);
      });

      item.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          copyIconFromItem(item);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIconCopy);
  } else {
    initIconCopy();
  }
})();
