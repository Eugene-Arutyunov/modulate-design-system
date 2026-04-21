(function () {
  var cancelInviteBackdrop = document.getElementById("modal-cancel-invite");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cancel-invite]");
    if (!btn) return;
    var emailSpan = cancelInviteBackdrop && cancelInviteBackdrop.querySelector("[data-cancel-invite-email]");
    if (emailSpan) emailSpan.textContent = btn.dataset.inviteEmail || "";
    window.M.openModal(cancelInviteBackdrop);
  });
})();
