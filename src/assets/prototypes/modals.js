(function () {
  var openCount = 0;

  function openModal(backdrop) {
    if (!backdrop) return;
    backdrop.hidden = false;
    openCount++;
    if (openCount === 1) {
      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = scrollbarWidth + "px";
      document.documentElement.style.overflow = "hidden";
    }
    var firstInput = backdrop.querySelector("input, select, textarea");
    if (firstInput) firstInput.focus();
  }

  function closeModal(backdrop) {
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
    }
  }

  document.addEventListener("click", function (e) {
    var closeTarget = e.target.closest("[data-modal-close]");
    if (closeTarget) {
      closeModal(document.getElementById(closeTarget.dataset.modalClose));
      return;
    }

    var openTarget = e.target.closest("[data-modal-open]");
    if (openTarget) {
      openModal(document.getElementById(openTarget.dataset.modalOpen));
      return;
    }

    if (e.target.classList.contains("m__modal-backdrop")) {
      closeModal(e.target);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".m__modal-backdrop:not([hidden])").forEach(closeModal);
  });

  window.M = { openModal: openModal, closeModal: closeModal };
})();
