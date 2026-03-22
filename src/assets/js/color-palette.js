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

  function initPlates() {
    var plates = document.querySelectorAll(".guide-color-plate");
    plates.forEach(function (plate) {
      var btn = plate.querySelector(".guide-color-plate__value");
      if (!btn) return;

      var computed = getComputedStyle(plate).backgroundColor;
      var rgb = formatRgb(computed);
      btn.textContent = rgb;

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
