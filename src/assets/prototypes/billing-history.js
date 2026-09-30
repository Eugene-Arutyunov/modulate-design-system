/* Billing › Overview history widget: Filter (Date / Type / Status) and Export,
   built on the shared TableFilters (same pattern as the Review Queue). */
(function () {
  var widget = document.querySelector(".billing-history");
  if (!widget || !window.TableFilters) return;

  function activeRows() {
    var wrap = widget.querySelector('.m__table-wrapper[data-for="' + document.body.dataset.billingType + '"]');
    return wrap ? [].slice.call(wrap.querySelectorAll("tr[data-kind]")) : [];
  }

  var text = function (el) { return el ? el.textContent.trim() : ""; };

  var table = TableFilters.init({
    widget: widget,
    controls: widget.querySelector("[data-billing-history-filters]"),
    strip: widget.querySelector("[data-billing-history-strip]"),
    rows: function () { return [].slice.call(widget.querySelectorAll("tr[data-kind]")); },
    activeRows: activeRows,
    today: new Date(2026, 8, 29),
    categories: [
      { name: "Date", attr: "date" },
      { name: "Type", attr: "kind", labels: { "top-up": "Top-ups", recharge: "Top-ups", allocation: "Monthly allocations", grant: "Credit grants", invoice: "Monthly invoices" } },
      { name: "Status", attr: "status" }
    ],
    exportCsv: {
      filename: "billing-history.csv",
      label: "Export billing history to CSV",
      head: ["Date", "Type", "Payment method", "Number", "Credits", "Amount", "Status"],
      cells: function (tr) {
        var td = tr.children;
        var type = td[1].cloneNode(true);
        var small = type.querySelector("small");
        if (small) small.remove();
        // Amount without the commitment / overage breakdown under it.
        var amount = td[4].cloneNode(true);
        var lines = amount.querySelector("small");
        if (lines) lines.remove();
        return [text(td[0]), text(type), text(td[1].querySelector(".billing-history__method")), text(td[2]), text(td[3]), text(amount), text(td[5])];
      }
    },
    toast: function (m) { (window.billingToast || function () {})(m); }
  });

  // Type and Status values depend on the customer type; drop ones that no longer exist.
  document.addEventListener("billing:change", function () {
    ["Type", "Status"].forEach(function (c) {
      var v = table.filters()[c];
      if (v && !table.choices(c).some(function (x) { return x[0] === v; })) table.clear(c);
    });
    table.apply();
  });
})();
