(function () {
  var activeList = null;
  var activeTrigger = null;

  function closeMenu() {
    if (!activeList) return;
    activeList.hidden = true;
    if (activeList._amOriginalParent) {
      activeList._amOriginalParent.appendChild(activeList);
    }
    activeList = null;
    activeTrigger = null;
  }

  function openMenu(trigger) {
    closeMenu();
    var menu = trigger.closest(".m__action-menu");
    var list = menu.querySelector(".m__action-menu-list");

    list._amOriginalParent = menu;
    document.body.appendChild(list);

    var rect = trigger.getBoundingClientRect();
    list.style.top = rect.bottom + 4 + "px";
    list.style.left = rect.left + "px";
    list.style.right = "auto";
    list.style.transform = "";

    list.hidden = false;
    activeList = list;
    activeTrigger = trigger;
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".m__action-menu-trigger");
    if (trigger) {
      if (activeTrigger === trigger) {
        closeMenu();
      } else {
        openMenu(trigger);
      }
      return;
    }
    if (e.target.closest(".m__action-menu-item")) {
      closeMenu();
      return;
    }
    if (!e.target.closest(".m__action-menu-list")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);
})();
