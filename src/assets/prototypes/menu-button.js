(function () {
  var activeList = null;
  var activeTrigger = null;

  function closeMenu() {
    if (!activeList) return;
    activeList.hidden = true;
    if (activeList._menuButtonOriginalParent) {
      activeList._menuButtonOriginalParent.appendChild(activeList);
    }
    activeTrigger.classList.remove("m__menu-button-trigger--active");
    activeTrigger.setAttribute("aria-expanded", "false");
    activeList = null;
    activeTrigger = null;
  }

  function openMenu(trigger) {
    closeMenu();
    var menu = trigger.closest(".m__menu-button");
    if (!menu) return;
    var list = menu.querySelector(".m__menu-button-list");
    if (!list) return;

    list._menuButtonOriginalParent = menu;
    document.body.appendChild(list);

    var rect = trigger.getBoundingClientRect();
    list.style.top = rect.bottom + 4 + "px";
    list.style.left = "auto";
    list.style.right = document.documentElement.clientWidth - rect.right + "px";
    list.style.transform = "";

    list.hidden = false;
    activeList = list;
    activeTrigger = trigger;
    trigger.classList.add("m__menu-button-trigger--active");
    trigger.setAttribute("aria-expanded", "true");
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".m__menu-button-trigger");
    if (trigger) {
      if (activeTrigger === trigger) {
        closeMenu();
      } else {
        openMenu(trigger);
      }
      return;
    }
    if (e.target.closest(".m__menu-button-item")) {
      closeMenu();
      return;
    }
    if (!e.target.closest(".m__menu-button-list")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);
})();
