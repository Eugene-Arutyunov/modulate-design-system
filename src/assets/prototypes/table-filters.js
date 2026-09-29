/*
 * Table filters, same pattern as the Review Queue: a Filter button with category
 * submenus (Date gets "Custom range" plus presets), removable conditions above the
 * table with "Reset filters", and an optional Export of the visible rows to CSV.
 *
 * TableFilters.init({
 *   widget,            // element that holds the table(s)
 *   controls,          // element the Filter / Export buttons go into
 *   strip,             // element for the chosen conditions
 *   rows(),            // all filterable <tr> in the widget
 *   activeRows(),      // rows the value lists are built from (defaults to rows)
 *   categories: [{ name, attr, labels? }],  // attr = data-* key on each row; "date" is special
 *   today,             // Date the presets count back from
 *   exportCsv: { filename, head, cells(tr) → [text], label },
 *   toast(message)
 * }) → { apply, choices, filters }
 */
(function () {
  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  var DATE_PRESETS = [["30", "Last 30 days"], ["90", "Last 3 months"], ["365", "Last 12 months"]];

  function init(cfg) {
    var widget = cfg.widget;
    var TODAY = cfg.today || new Date();
    var toast = cfg.toast || function () {};
    var CATEGORIES = cfg.categories.map(function (c) { return c.name; });
    var byName = {};
    cfg.categories.forEach(function (c) { byName[c.name] = c; });
    var rows = cfg.rows;
    var activeRows = cfg.activeRows || cfg.rows;
    var filters = {};

    function isDate(category) { return byName[category].attr === "date"; }
    var DATE = CATEGORIES.filter(isDate)[0];

    function parseDate(text) {
      var m = (text || "").match(/(\d+) (\w{3}) (\d{4})/);
      return m ? new Date(+m[3], MONTHS[m[2]], +m[1]) : TODAY;
    }

    function choices(category) {
      if (isDate(category)) return DATE_PRESETS;
      var c = byName[category];
      var seen = [];
      activeRows().forEach(function (tr) {
        var v = tr.dataset[c.attr];
        if (v && seen.indexOf(v) < 0) seen.push(v);
      });
      return seen.map(function (v) { return [v, (c.labels && c.labels[v]) || v]; });
    }

    function isoDate(iso) {
      var p = iso.split("-");
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function shortDate(iso) {
      var d = isoDate(iso);
      return d.getDate() + " " + Object.keys(MONTHS)[d.getMonth()] + " " + d.getFullYear();
    }

    function labelOf(category, value) {
      if (isDate(category) && value.indexOf("custom:") === 0) {
        var range = value.split(":");
        return (range[1] ? shortDate(range[1]) : "…") + " – " + (range[2] ? shortDate(range[2]) : "…");
      }
      var hit = choices(category).filter(function (c) { return c[0] === value; })[0];
      return hit ? hit[1] : value;
    }

    function matches(tr) {
      return CATEGORIES.every(function (c) {
        var v = filters[c];
        if (!v) return true;
        if (isDate(c)) {
          var d = parseDate(tr.dataset.date);
          if (v.indexOf("custom:") === 0) {
            var range = v.split(":");
            return (!range[1] || d >= isoDate(range[1])) && (!range[2] || d <= isoDate(range[2]));
          }
          return (TODAY - d) / 864e5 <= +v;
        }
        return tr.dataset[byName[c].attr] === v;
      });
    }

    function apply() {
      widget.querySelectorAll("tbody").forEach(function (tbody) {
        var visible = 0;
        rows().forEach(function (tr) {
          if (tr.parentNode !== tbody) return;
          tr.hidden = !matches(tr);
          if (!tr.hidden) visible++;
        });
        var empty = tbody.querySelector("[data-filter-empty]");
        if (empty) empty.hidden = visible > 0;
      });
      renderStrip();
    }

    /* ── Filter button + popup ─────────────────────────────────────────── */

    var host = document.createElement("div");
    host.className = "review-filter-builder table-filters__filter";
    host.innerHTML =
      '<button type="button" class="m__button-secondary-outline S" data-filter-open aria-expanded="false">' +
      '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#filter"></use></svg>Filter</button>' +
      '<div class="review-filter-popup" hidden><div class="review-filter-categories"></div>' +
      '<div class="review-filter-options" hidden><div class="review-filter-options-title"></div>' +
      '<div class="review-filter-values"></div></div></div>';
    cfg.controls.appendChild(host);

    /* ── Export: the rows that match the current filters, as CSV ── */

    if (cfg.exportCsv) {
      var exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.className = "m__button-secondary-outline S table-filters__export";
      exportButton.textContent = "Export";
      exportButton.setAttribute("aria-label", cfg.exportCsv.label || "Export to CSV");
      cfg.controls.appendChild(exportButton);

      exportButton.addEventListener("click", function () {
        var quote = function (text) { return '"' + String(text).trim().replace(/\s+/g, " ").replace(/"/g, '""') + '"'; };
        var lines = [cfg.exportCsv.head.join(",")];
        rows().forEach(function (tr) {
          if (tr.hidden || tr.offsetParent === null) return;
          lines.push(cfg.exportCsv.cells(tr).map(quote).join(","));
        });
        var count = lines.length - 1;
        if (!count) { toast("Nothing to export with these filters."); return; }
        var link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = cfg.exportCsv.filename;
        link.click();
        setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
        toast("Exported " + count + (count === 1 ? " row." : " rows."));
      });
    }

    var strip = cfg.strip;
    var open = host.querySelector("[data-filter-open]");
    var popup = host.querySelector(".review-filter-popup");
    var options = host.querySelector(".review-filter-options");
    var active = "";

    function close() {
      popup.hidden = true;
      popup.classList.remove("is-direct-filter");
      popup.style.left = popup.style.top = "";
      open.setAttribute("aria-expanded", "false");
    }

    function showCategory(category) {
      active = category;
      var buttons = Array.prototype.slice.call(host.querySelectorAll(".review-filter-categories button"));
      buttons.forEach(function (b) { b.classList.toggle("is-active", b.dataset.category === category); });
      var btn = buttons.filter(function (b) { return b.dataset.category === category; })[0];
      popup.hidden = false;
      options.hidden = false;
      host.querySelector(".review-filter-options-title").textContent = category;
      renderValues();
      var first = options.querySelector(".review-filter-values button");
      options.style.top = btn && first
        ? btn.offsetTop - (first.getBoundingClientRect().top - options.getBoundingClientRect().top) + "px"
        : "0px";
    }

    // Date gets a "Custom range" row on top, same as the Review Queue: typed
    // dd.mm.yyyy fields sized to their text, a hidden native picker on second click.
    function renderDateRange(list) {
      var custom = (filters[DATE] || "").indexOf("custom:") === 0 ? filters[DATE].split(":") : null;
      var header = document.createElement("div");
      header.className = "review-date-range-header";
      header.innerHTML =
        '<button type="button" data-date-custom aria-expanded="false">Custom range</button>' +
        '<div class="review-date-range-fields" hidden><input type="date" aria-label="From">' +
        "<span>–</span>" + '<input type="date" aria-label="To"></div>';
      options.insertBefore(header, list);
      var button = header.querySelector("[data-date-custom]");
      var fields = header.querySelector(".review-date-range-fields");
      var pickers = fields.querySelectorAll("input");
      var from = pickers[0], to = pickers[1];
      if (custom) { from.value = custom[1]; to.value = custom[2]; }
      var editingRange = Boolean(custom);

      function applyRange() {
        if (!from.checkValidity() || !to.checkValidity()) return;
        filters[DATE] = from.value || to.value ? "custom:" + from.value + ":" + to.value : "";
        refresh();
        apply();
      }

      var editors = [from, to].map(function (picker, index) {
        picker.classList.add("review-date-calendar-anchor");
        picker.tabIndex = -1;
        picker.setAttribute("aria-hidden", "true");
        var editor = document.createElement("input");
        editor.type = "text";
        editor.placeholder = "dd.mm.yyyy";
        editor.inputMode = "numeric";
        editor.maxLength = 10;
        editor.setAttribute("aria-label", index ? "To" : "From");
        picker.before(editor);
        function resize() {
          var ctx = document.createElement("canvas").getContext("2d");
          ctx.font = getComputedStyle(editor).font;
          editor.style.width = Math.ceil(ctx.measureText(editor.value || editor.placeholder).width + 2) + "px";
        }
        var wasFocused = false;
        editor.addEventListener("pointerdown", function () { wasFocused = document.activeElement === editor; });
        editor.addEventListener("click", function () {
          if (!wasFocused) return;
          var r = editor.getBoundingClientRect();
          Object.assign(picker.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
          try { picker.showPicker(); } catch (err) { /* not supported */ }
        });
        editor.addEventListener("input", function () {
          var digits = editor.value.replace(/\D/g, "").slice(0, 8);
          editor.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(".");
          resize();
        });
        editor.addEventListener("change", function () {
          var m = editor.value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
          if (!editor.value) picker.value = "";
          else if (m) {
            var parsed = new Date(+m[3], +m[2] - 1, +m[1]);
            if (parsed.getDate() !== +m[1] || parsed.getMonth() !== +m[2] - 1) return;
            picker.value = m[3] + "-" + m[2] + "-" + m[1];
          } else return;
          applyRange();
        });
        return { editor: editor, resize: resize, picker: picker };
      });

      function refresh() {
        button.hidden = editingRange;
        fields.hidden = !editingRange;
        button.setAttribute("aria-expanded", String(editingRange));
        from.max = to.value;
        to.min = from.value;
        editors.forEach(function (x) {
          x.editor.value = x.picker.value ? x.picker.value.split("-").reverse().join(".") : "";
          if (editingRange) x.resize();
        });
      }

      refresh();
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        editingRange = true;
        refresh();
        editors[0].editor.focus();
      });
      from.addEventListener("change", applyRange);
      to.addEventListener("change", applyRange);
    }

    function renderValues() {
      var list = host.querySelector(".review-filter-values");
      list.innerHTML = "";
      var header = options.querySelector(".review-date-range-header");
      if (header) header.remove();
      options.classList.toggle("has-date-range", isDate(active));
      if (isDate(active)) renderDateRange(list);
      choices(active).forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = c[1];
        b.setAttribute("aria-pressed", String(filters[active] === c[0]));
        b.insertAdjacentHTML("beforeend", '<svg class="moderation-sort-check" viewBox="0 0 10 10" aria-hidden="true"><use href="#checkmark"></use></svg>');
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          filters[active] = filters[active] === c[0] ? "" : c[0];
          close();
          apply();
          open.focus();
        });
        list.appendChild(b);
      });
    }

    CATEGORIES.forEach(function (category) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.category = category;
      b.textContent = category;
      b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 12 12" aria-hidden="true"><use href="#chevron-down"></use></svg>');
      b.addEventListener("click", function () { showCategory(category); });
      b.addEventListener("mouseenter", function () { showCategory(category); });
      host.querySelector(".review-filter-categories").appendChild(b);
    });

    open.addEventListener("click", function () {
      var opening = popup.hidden || popup.classList.contains("is-direct-filter");
      close();
      options.hidden = true;
      host.querySelectorAll(".review-filter-categories button").forEach(function (b) { b.classList.remove("is-active"); });
      popup.hidden = !opening;
      open.setAttribute("aria-expanded", String(opening));
    });

    document.addEventListener("click", function (e) {
      if (!host.contains(e.target) && !strip.contains(e.target)) close();
    });
    host.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); open.focus(); }
    });

    /* ── Selected conditions ───────────────────────────────────────────── */

    function renderStrip() {
      strip.innerHTML = "";
      CATEGORIES.forEach(function (category) {
        if (!filters[category]) return;
        var condition = document.createElement("div");
        condition.className = "review-filter-condition";
        var edit = document.createElement("button");
        edit.type = "button";
        edit.innerHTML = "<span></span><span></span>";
        edit.children[0].textContent = category + ": ";
        edit.children[1].textContent = labelOf(category, filters[category]);
        edit.addEventListener("click", function () {
          showCategory(category);
          popup.classList.add("is-direct-filter");
          var anchor = condition.getBoundingClientRect();
          var box = host.getBoundingClientRect();
          popup.style.left = Math.max(16, anchor.left) - box.left + "px";
          popup.style.top = anchor.bottom - box.top + 6 + "px";
        });
        var remove = document.createElement("button");
        remove.type = "button";
        remove.setAttribute("aria-label", "Remove " + category + " filter");
        remove.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><use href="#close"></use></svg>';
        remove.addEventListener("click", function () { filters[category] = ""; apply(); });
        condition.append(edit, remove);
        strip.appendChild(condition);
      });
      strip.hidden = !strip.children.length;
      if (!strip.hidden) {
        var reset = document.createElement("button");
        reset.type = "button";
        reset.className = "review-filter-clear";
        reset.textContent = "Reset filters";
        reset.addEventListener("click", function () { filters = {}; apply(); });
        strip.appendChild(reset);
      }
    }

    apply();
    return { apply: apply, choices: choices, filters: function () { return filters; }, clear: function (c) { filters[c] = ""; } };
  }

  window.TableFilters = { init: init };
})();
