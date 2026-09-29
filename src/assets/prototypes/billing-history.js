/* Billing › Overview history widget: Filter button with Date / Type / Status
   submenus and removable conditions, same pattern as the Review Queue. */
(function () {
  var widget = document.querySelector(".billing-history");
  if (!widget) return;

  var TODAY = new Date(2026, 8, 29);
  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  var TYPE_LABELS = {
    "top-up": "Top-ups",
    recharge: "Recharges",
    allocation: "Monthly allocations",
    grant: "Credit grants",
    invoice: "Monthly invoices"
  };
  var CHOICES = {
    Date: [["30", "Last 30 days"], ["90", "Last 3 months"], ["365", "Last 12 months"]]
  };
  var CATEGORIES = ["Date", "Type", "Status"];
  var filters = {};

  function parseDate(text) {
    var m = text.match(/(\d+) (\w{3}) (\d{4})/);
    return m ? new Date(+m[3], MONTHS[m[2]], +m[1]) : TODAY;
  }

  function activeRows() {
    var wrap = widget.querySelector('.m__table-wrapper[data-for="' + document.body.dataset.billingType + '"]');
    return wrap ? Array.prototype.slice.call(wrap.querySelectorAll("tr[data-kind]")) : [];
  }

  function choices(category) {
    if (CHOICES[category]) return CHOICES[category];
    var seen = [];
    activeRows().forEach(function (tr) {
      var v = category === "Type" ? tr.dataset.kind : tr.dataset.status;
      if (seen.indexOf(v) < 0) seen.push(v);
    });
    return seen.map(function (v) { return [v, category === "Type" ? TYPE_LABELS[v] || v : v]; });
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
    if (category === "Date" && value.indexOf("custom:") === 0) {
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
      if (c === "Type") return tr.dataset.kind === v;
      if (c === "Status") return tr.dataset.status === v;
      if (c === "Date") {
        var d = parseDate(tr.dataset.date);
        if (v.indexOf("custom:") === 0) {
          var range = v.split(":");
          return (!range[1] || d >= isoDate(range[1])) && (!range[2] || d <= isoDate(range[2]));
        }
        return (TODAY - d) / 864e5 <= +v;
      }
      return true;
    });
  }

  function apply() {
    widget.querySelectorAll("tbody").forEach(function (tbody) {
      var visible = 0;
      tbody.querySelectorAll("tr[data-kind]").forEach(function (tr) {
        tr.hidden = !matches(tr);
        if (!tr.hidden) visible++;
      });
      var empty = tbody.querySelector("[data-billing-filter-empty]");
      if (empty) empty.hidden = visible > 0;
    });
    renderStrip();
  }

  /* ── Filter button + popup ─────────────────────────────────────────── */

  var host = document.createElement("div");
  host.className = "review-filter-builder billing-history__filter";
  host.innerHTML =
    '<button type="button" class="m__button-secondary-outline S" data-filter-open aria-expanded="false">' +
    '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#filter"></use></svg>Filter</button>' +
    '<div class="review-filter-popup" hidden><div class="review-filter-categories"></div>' +
    '<div class="review-filter-options" hidden><div class="review-filter-options-title"></div>' +
    '<div class="review-filter-values"></div></div></div>';
  widget.querySelector("[data-billing-history-filters]").appendChild(host);

  var open = host.querySelector("[data-filter-open]");
  var popup = host.querySelector(".review-filter-popup");
  var options = host.querySelector(".review-filter-options");
  var strip = widget.querySelector("[data-billing-history-strip]");
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
    var custom = (filters.Date || "").indexOf("custom:") === 0 ? filters.Date.split(":") : null;
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
      filters.Date = from.value || to.value ? "custom:" + from.value + ":" + to.value : "";
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
    options.classList.toggle("has-date-range", active === "Date");
    if (active === "Date") renderDateRange(list);
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

  // Type and Status values depend on the customer type; drop ones that no longer exist.
  document.addEventListener("billing:change", function () {
    ["Type", "Status"].forEach(function (c) {
      if (filters[c] && !choices(c).some(function (x) { return x[0] === filters[c]; })) filters[c] = "";
    });
    apply();
  });
  apply();
})();
