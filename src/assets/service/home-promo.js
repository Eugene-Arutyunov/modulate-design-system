(function () {
  "use strict";

  // Palette teaser: same rules as the Icon Studio background dropdown —
  // tokens come straight from the stylesheet, these families are excluded,
  // the listed families come first in this order.
  var PALETTE_EXCLUDED_FAMILIES = ["orange", "yellow"];
  var PALETTE_FAMILY_ORDER = [
    "slate",
    "white",
    "gray",
    "blue",
    "azure",
    "pink",
    "green",
    "red",
  ];

  function getPaletteTokens() {
    var tokens = [];
    var seen = {};

    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules;

      try {
        rules = sheet.cssRules;
      } catch (error) {
        return;
      }

      Array.prototype.forEach.call(rules, function (rule) {
        if (!rule.selectorText || rule.selectorText.indexOf(":root") === -1) {
          return;
        }

        Array.prototype.forEach.call(rule.style, function (property) {
          if (property.indexOf("--m__color-") === 0 && !seen[property]) {
            seen[property] = true;
            tokens.push(property.slice("--m__color-".length));
          }
        });
      });
    });

    var familyOf = function (token) {
      return token.replace(/-\d+$/, "");
    };
    var rankOf = function (token) {
      var rank = PALETTE_FAMILY_ORDER.indexOf(familyOf(token));

      return rank === -1 ? PALETTE_FAMILY_ORDER.length : rank;
    };

    return tokens
      .filter(function (token) {
        return PALETTE_EXCLUDED_FAMILIES.indexOf(familyOf(token)) === -1;
      })
      .map(function (token, index) {
        return { token: token, index: index };
      })
      .sort(function (a, b) {
        return rankOf(a.token) - rankOf(b.token) || a.index - b.index;
      })
      .map(function (entry) {
        return entry.token;
      });
  }

  function isDarkColor(cssColor) {
    var match = cssColor.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);

    if (!match) {
      return false;
    }

    var red = Number(match[1]);
    var green = Number(match[2]);
    var blue = Number(match[3]);

    return red * 0.299 + green * 0.587 + blue * 0.114 < 130;
  }

  function initPalette() {
    var host = document.querySelector("[data-home-palette]");

    if (!host) {
      return;
    }

    var rootStyle = getComputedStyle(document.documentElement);

    getPaletteTokens().forEach(function (token) {
      var plate = document.createElement("span");
      var value = rootStyle.getPropertyValue("--m__color-" + token).trim();

      plate.className = "home-promo__palette-color";
      plate.textContent = token;
      plate.style.backgroundColor = "var(--m__color-" + token + ")";
      plate.style.color = isDarkColor(value) ? "#fff" : "rgb(30, 30, 40)";
      host.appendChild(plate);
    });
  }

  // One-big-link cards that can't be an <a> (they contain buttons and form
  // controls): any click inside navigates to the card target. preventDefault
  // keeps the showcase controls from changing state on the way out.
  function initPromoLinks() {
    var cards = document.querySelectorAll("[data-promo-link]");

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = card.getAttribute("data-promo-link");
      });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          window.location.href = card.getAttribute("data-promo-link");
        }
      });
    });
  }

  initPalette();
  initPromoLinks();
})();
