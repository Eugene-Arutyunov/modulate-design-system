(function () {
  "use strict";

  var page = document.querySelector("[data-palette-lamp]");
  if (!page) return;

  var toggle = page.querySelector("[data-palette-lamp-toggle]");
  if (!toggle) return;

  function syncLamp() {
    page.classList.toggle("is-on", toggle.checked);
  }

  toggle.addEventListener("change", syncLamp);
  syncLamp();
})();
