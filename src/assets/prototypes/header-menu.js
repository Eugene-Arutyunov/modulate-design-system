(function () {
  var authStorageKey = "prototype-auth-state";
  var signedInClass = "prototype-auth-signed-in";
  var signedOutClass = "prototype-auth-signed-out";

  function getDefaultAuthState() {
    return document.body.dataset.prototypeAuthDefault === "signed-in"
      ? "signed-in"
      : "signed-out";
  }

  function readAuthState() {
    var defaultState = getDefaultAuthState();

    try {
      var storedState = localStorage.getItem(authStorageKey);

      if (defaultState === "signed-in") {
        localStorage.setItem(authStorageKey, "signed-in");
        return "signed-in";
      }

      if (storedState === "signed-in") return "signed-in";
    } catch (e) {
      // Keep the page default when storage is unavailable.
    }

    return defaultState;
  }

  function applyAuthState(state) {
    var signedIn = state === "signed-in";
    document.body.classList.toggle(signedInClass, signedIn);
    document.body.classList.toggle(signedOutClass, !signedIn);
  }

  function setAuthState(state) {
    try {
      localStorage.setItem(authStorageKey, state);
    } catch (e) {
      // Visual state still updates for this page.
    }

    applyAuthState(state);
  }

  applyAuthState(readAuthState());

  document
    .querySelectorAll(
      '[data-prototype-auth-sign-in], a[href^="/dashboard/"], a[href="/moderation/"]'
    )
    .forEach(function (item) {
      item.addEventListener("click", function () {
        setAuthState("signed-in");
      });
    });

  document
    .querySelectorAll("[data-prototype-auth-sign-out]")
    .forEach(function (item) {
      item.addEventListener("click", function () {
        setAuthState("signed-out");
      });
    });

  var trigger = document.getElementById("header-user-trigger");
  var popover = document.getElementById("header-user-popover");
  var appearanceItem = popover?.querySelector(
    ".prototype-header__popover-appearance"
  );
  var appearanceToggle = appearanceItem?.querySelector(".theme-toggle");
  if (!trigger || !popover) return;

  function open() {
    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }

  function close() {
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function toggle() {
    if (popover.hidden) {
      open();
    } else {
      close();
    }
  }

  trigger.addEventListener("click", function (e) {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener("click", function (e) {
    if (popover.hidden) return;
    if (trigger.contains(e.target) || popover.contains(e.target)) return;
    close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (popover.hidden) return;
    close();
  });

  if (appearanceItem && appearanceToggle) {
    appearanceItem.addEventListener("click", function (e) {
      if (e.target === appearanceToggle || appearanceToggle.contains(e.target))
        return;
      appearanceToggle.click();
    });

    appearanceItem.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      appearanceToggle.click();
    });
  }
})();
