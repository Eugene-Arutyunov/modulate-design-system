// Control Center (/tools/control-center/): stream filter, type filter (All /
// Task / Project / Process / Asset / Product / Tool) and a "Show done"
// checkbox. Done rows (data-cc-done) stay hidden until the checkbox is on.
// The stream label shows only on the first visible row of each stream, and
// the last visible row of each stream gets .cc__stream-end for the darker
// divider, so both are recomputed on every filter change.
(function () {
  var inputs = document.querySelectorAll("[data-cc-filter]");
  var streamInputs = document.querySelectorAll("[data-cc-stream-filter]");
  var doneToggle = document.querySelector("[data-cc-done-toggle]");
  var rows = document.querySelectorAll("[data-cc-type]");
  if (!inputs.length) return;

  function checkedValue(list) {
    var value = "all";
    list.forEach(function (input) {
      if (input.checked) value = input.value;
    });
    return value;
  }

  function apply() {
    var mode = checkedValue(inputs);
    var streamMode = checkedValue(streamInputs);
    var showDone = doneToggle && doneToggle.checked;
    var prevStream = null;
    var prevRow = null;
    rows.forEach(function (row) {
      row.classList.remove("cc__stream-end");
      var show =
        (streamMode === "all" || row.dataset.ccStream === streamMode) &&
        (mode === "all" || row.dataset.ccType === mode) &&
        (showDone || !row.hasAttribute("data-cc-done"));
      row.hidden = !show;
      if (!show) return;
      var first = row.dataset.ccStream !== prevStream;
      row.querySelector(".cc__stream").textContent = first
        ? row.dataset.ccStream
        : "";
      if (first && prevRow) prevRow.classList.add("cc__stream-end");
      prevStream = row.dataset.ccStream;
      prevRow = row;
    });
  }

  inputs.forEach(function (input) {
    input.addEventListener("change", apply);
  });
  streamInputs.forEach(function (input) {
    input.addEventListener("change", apply);
  });
  if (doneToggle) doneToggle.addEventListener("change", apply);
  apply();
})();
