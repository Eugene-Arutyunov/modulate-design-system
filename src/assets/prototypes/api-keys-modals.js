(function () {
  var createBackdrop = document.getElementById("modal-api-key-create");
  var editBackdrop = document.getElementById("modal-api-key-edit");
  var deactivateBackdrop = document.getElementById("modal-api-key-deactivate");
  var deleteBackdrop = document.getElementById("modal-api-key-delete");
  var activateBackdrop = document.getElementById("modal-api-key-activate");

  var keyTypeHints = {
    model: "Model keys access inference endpoints.",
    "console-admin": "Console Admin keys can perform any console action via the API.",
    "console-read-only": "Console Read-Only keys can read console data but not modify it.",
  };

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-api-key-create]")) {
      window.M.openModal(createBackdrop);
      return;
    }

    var editBtn = e.target.closest("[data-api-key-edit]");
    if (editBtn) {
      var nameInput = editBackdrop && editBackdrop.querySelector("#edit-key-name");
      var descInput = editBackdrop && editBackdrop.querySelector("#edit-key-description");
      if (nameInput) nameInput.value = editBtn.dataset.apiKeyName || "";
      if (descInput) descInput.value = "";
      window.M.openModal(editBackdrop);
      return;
    }

    var deactivateBtn = e.target.closest("[data-api-key-deactivate]");
    if (deactivateBtn) {
      var nameSpan = deactivateBackdrop && deactivateBackdrop.querySelector("[data-deactivate-key-name]");
      if (nameSpan) nameSpan.textContent = deactivateBtn.dataset.apiKeyName || "";
      window.M.openModal(deactivateBackdrop);
      return;
    }

    var deleteBtn = e.target.closest("[data-api-key-delete]");
    if (deleteBtn) {
      var nameSpan = deleteBackdrop && deleteBackdrop.querySelector("[data-delete-key-name]");
      if (nameSpan) nameSpan.textContent = deleteBtn.dataset.apiKeyName || "";
      window.M.openModal(deleteBackdrop);
      return;
    }

    var activateBtn = e.target.closest("[data-api-key-activate]");
    if (activateBtn) {
      var nameSpan = activateBackdrop && activateBackdrop.querySelector("[data-activate-key-name]");
      if (nameSpan) nameSpan.textContent = activateBtn.dataset.apiKeyName || "";
      window.M.openModal(activateBackdrop);
    }
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
