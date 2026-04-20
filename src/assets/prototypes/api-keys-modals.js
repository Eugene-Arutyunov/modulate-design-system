(function () {
  var createBackdrop = document.getElementById("modal-api-key-create");
  var editBackdrop = document.getElementById("modal-api-key-edit");
  var deactivateBackdrop = document.getElementById("modal-api-key-deactivate");
  var deleteBackdrop = document.getElementById("modal-api-key-delete");
  var activateBackdrop = document.getElementById("modal-api-key-activate");

  var keyTypeHints = {
    model: "Model keys access inference endpoints.",
    "console-admin":
      "Console Admin keys can perform any console action via the API.",
    "console-read-only":
      "Console Read-Only keys can read console data but not modify it.",
  };

  var openCount = 0;

  function openModal(backdrop) {
    if (!backdrop) return;
    backdrop.hidden = false;
    openCount++;
    if (openCount === 1) {
      var scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = scrollbarWidth + "px";
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
    }
  }

  function closeById(id) {
    closeModal(document.getElementById(id));
  }

  document.addEventListener("click", function (e) {
    var closeTarget = e.target.closest("[data-modal-close]");
    if (closeTarget) {
      closeById(closeTarget.dataset.modalClose);
      return;
    }

    if (e.target === createBackdrop) closeModal(createBackdrop);
    if (e.target === editBackdrop) closeModal(editBackdrop);
    if (e.target === deactivateBackdrop) closeModal(deactivateBackdrop);
    if (e.target === deleteBackdrop) closeModal(deleteBackdrop);
    if (e.target === activateBackdrop) closeModal(activateBackdrop);

    if (e.target.closest("[data-api-key-create]")) {
      openModal(createBackdrop);
      return;
    }

    var editBtn = e.target.closest("[data-api-key-edit]");
    if (editBtn) {
      var name = editBtn.dataset.apiKeyName || "";
      var nameInput =
        editBackdrop && editBackdrop.querySelector("#edit-key-name");
      var descInput =
        editBackdrop && editBackdrop.querySelector("#edit-key-description");
      if (nameInput) nameInput.value = name;
      if (descInput) descInput.value = "";
      openModal(editBackdrop);
      return;
    }

    var deactivateBtn = e.target.closest("[data-api-key-deactivate]");
    if (deactivateBtn) {
      var name = deactivateBtn.dataset.apiKeyName || "";
      var nameSpan =
        deactivateBackdrop &&
        deactivateBackdrop.querySelector("[data-deactivate-key-name]");
      if (nameSpan) nameSpan.textContent = name;
      openModal(deactivateBackdrop);
      return;
    }

    var deleteBtn = e.target.closest("[data-api-key-delete]");
    if (deleteBtn) {
      var name = deleteBtn.dataset.apiKeyName || "";
      var nameSpan =
        deleteBackdrop &&
        deleteBackdrop.querySelector("[data-delete-key-name]");
      if (nameSpan) nameSpan.textContent = name;
      openModal(deleteBackdrop);
      return;
    }

    var activateBtn = e.target.closest("[data-api-key-activate]");
    if (activateBtn) {
      var name = activateBtn.dataset.apiKeyName || "";
      var nameSpan =
        activateBackdrop &&
        activateBackdrop.querySelector("[data-activate-key-name]");
      if (nameSpan) nameSpan.textContent = name;
      openModal(activateBackdrop);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (createBackdrop && !createBackdrop.hidden) closeModal(createBackdrop);
    if (editBackdrop && !editBackdrop.hidden) closeModal(editBackdrop);
    if (deactivateBackdrop && !deactivateBackdrop.hidden)
      closeModal(deactivateBackdrop);
    if (deleteBackdrop && !deleteBackdrop.hidden) closeModal(deleteBackdrop);
    if (activateBackdrop && !activateBackdrop.hidden)
      closeModal(activateBackdrop);
  });

  if (createBackdrop) {
    var keyTypeSelect = createBackdrop.querySelector("[data-key-type-select]");
    var keyTypeHint = createBackdrop.querySelector("[data-key-type-hint]");
    if (keyTypeSelect && keyTypeHint) {
      keyTypeSelect.addEventListener("change", function () {
        keyTypeHint.textContent = keyTypeHints[keyTypeSelect.value] || "";
      });
    }
  }
})();
