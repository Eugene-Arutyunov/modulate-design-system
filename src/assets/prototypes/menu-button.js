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
    var listWidth = rect.width;

    if (list.classList.contains("conversation-report__report-list")) {
      var rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      var reportListWidth = 16 * (rootFontSize || 16);
      listWidth = Math.max(rect.width, reportListWidth);
      list.style.width = listWidth + "px";
    }

    list.style.top = rect.bottom + 4 + "px";
    if (list.classList.contains("conversation-report__report-list--start")) {
      var start = Math.max(
        16,
        Math.min(rect.left, document.documentElement.clientWidth - listWidth - 16)
      );
      list.style.left = start + "px";
      list.style.right = "auto";
    } else {
      list.style.left = "auto";
      list.style.right = document.documentElement.clientWidth - rect.right + "px";
    }
    list.style.transform = "";

    list.hidden = false;
    activeList = list;
    activeTrigger = trigger;
    trigger.classList.add("m__menu-button-trigger--active");
    trigger.setAttribute("aria-expanded", "true");
  }

  function selectMenuItem(item) {
    var list = item.closest(".m__menu-button-list");
    if (!list || list.dataset.menuButtonSelect !== "trigger-text") return;

    var menu = list._menuButtonOriginalParent;
    var trigger = activeTrigger;
    if (!trigger && menu) {
      trigger = menu.querySelector(".m__menu-button-trigger");
    }
    if (!trigger) return;

    var title = item.querySelector(".conversation-report__report-item-title");
    var triggerText = trigger.querySelector(
      ".conversation-report__report-trigger-text"
    );
    if (title && triggerText) {
      triggerText.textContent = title.textContent.trim();
    }

    Array.prototype.forEach.call(
      list.querySelectorAll(".m__menu-button-item"),
      function (menuItem) {
        menuItem.classList.remove("is-active");
        menuItem.removeAttribute("aria-current");
      }
    );

    item.classList.add("is-active");
    item.setAttribute("aria-current", "true");
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
    var item = e.target.closest(".m__menu-button-item");
    if (item) {
      selectMenuItem(item);
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
