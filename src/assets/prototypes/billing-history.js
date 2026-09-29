/* Billing › Overview history widget: tabs (synced with the URL hash), document type filter, invoice line items. */
(function () {
  var tabs = document.querySelector("[data-billing-tabs]");
  if (!tabs) return;
  var panels = document.querySelectorAll("[data-billing-panel]");

  function available(value) {
    var type = document.body.dataset.billingType;
    return !(value === "payments" && type === "metered");
  }

  function show(value, updateHash) {
    if (!available(value)) value = "documents";
    panels.forEach(function (p) { p.hidden = p.dataset.billingPanel !== value; });
    tabs.querySelectorAll("input").forEach(function (input) {
      input.checked = input.value === value;
    });
    if (updateHash) history.replaceState(null, "", location.pathname + location.search + "#" + value);
  }

  tabs.addEventListener("change", function (e) { show(e.target.value, true); });

  function fromHash() {
    var value = location.hash.replace("#", "") || "documents";
    if (["documents", "payments", "usage", "grants"].indexOf(value) < 0) value = "documents";
    show(value, false);
  }
  window.addEventListener("hashchange", function () {
    fromHash();
    tabs.closest(".billing-history").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.addEventListener("billing:change", fromHash);
  fromHash();

  var filter = document.querySelector("[data-billing-doc-filter]");
  filter.addEventListener("change", function (e) {
    var value = e.target.value;
    document.querySelectorAll('[data-billing-panel="documents"] tbody').forEach(function (tbody) {
      var visible = 0;
      tbody.querySelectorAll("tr[data-doc-type]").forEach(function (tr) {
        var match = value === "all" || tr.dataset.docType === value;
        if (tr.hasAttribute("data-lines")) {
          var btn = document.querySelector('[aria-controls="' + tr.id + '"]');
          tr.hidden = !match || !btn || btn.getAttribute("aria-expanded") !== "true";
        } else {
          tr.hidden = !match;
          if (match) visible++;
        }
      });
      var empty = tbody.querySelector("[data-billing-filter-empty]");
      if (empty) empty.hidden = visible > 0;
    });
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-billing-expand]");
    if (!btn) return;
    var open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    document.getElementById(btn.getAttribute("aria-controls")).hidden = !open;
  });
})();
