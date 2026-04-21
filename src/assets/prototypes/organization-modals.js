(function () {
  document.addEventListener("click", function (e) {
    var row = e.target.closest("[data-org-row]");
    if (!row) return;

    var valueEl = row.querySelector("[data-org-value]");
    var editForm = row.querySelector("[data-org-edit-form]");
    var editBtn = row.querySelector("[data-org-edit-btn]");

    if (e.target.closest("[data-org-edit-btn]")) {
      valueEl.style.display = "none";
      editBtn.style.display = "none";
      editForm.style.display = "flex";
      var input = editForm.querySelector("input");
      if (input) input.focus();
      return;
    }

    if (e.target.closest("[data-org-save]") || e.target.closest("[data-org-cancel]")) {
      valueEl.style.display = "";
      editBtn.style.display = "";
      editForm.style.display = "none";
    }
  });

  var cancelInviteBackdrop = document.getElementById("modal-cancel-invite");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cancel-invite]");
    if (!btn) return;
    var emailSpan = cancelInviteBackdrop && cancelInviteBackdrop.querySelector("[data-cancel-invite-email]");
    if (emailSpan) emailSpan.textContent = btn.dataset.inviteEmail || "";
    window.M.openModal(cancelInviteBackdrop);
  });
})();
