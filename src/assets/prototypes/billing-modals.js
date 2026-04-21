(function () {
  var backdrop = document.getElementById("modal-billing-apply-code");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-apply-code]");
    if (!btn) return;
    var input = document.querySelector("[data-apply-code-input]");
    var nameSpan = backdrop && backdrop.querySelector("[data-apply-code-name]");
    if (nameSpan) nameSpan.textContent = input ? input.value : "";
    window.M.openModal(backdrop);
  });
})();
