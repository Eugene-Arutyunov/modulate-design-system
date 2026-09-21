// Control Center (/tools/control-center/): All / Discovery / Delivery
// segmented filter. The stream label shows only on the first visible row of
// each stream, so it is recomputed on every filter change.
(function () {
  var inputs = document.querySelectorAll("[data-cc-filter]");
  var rows = document.querySelectorAll("[data-cc-type]");
  if (!inputs.length) return;

  function apply() {
    var mode = "all";
    inputs.forEach(function (input) {
      if (input.checked) mode = input.value;
    });
    var prevStream = null;
    rows.forEach(function (row) {
      var show = mode === "all" || row.dataset.ccType === mode;
      row.hidden = !show;
      if (!show) return;
      var cell = row.querySelector(".cc__stream");
      cell.textContent =
        row.dataset.ccStream === prevStream ? "" : row.dataset.ccStream;
      prevStream = row.dataset.ccStream;
    });
  }

  inputs.forEach(function (input) {
    input.addEventListener("change", apply);
  });
  apply();
})();
