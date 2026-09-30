/* Billing › Email alerts + auto-recharge. The overview shows one-line summaries;
   each Edit opens a modal that edits the whole list in place (rows + trash, Add, Save). */
(function () {
  var toast = window.billingToast || function () {};
  var parse = function (v) { return parseInt(String(v).replace(/\D/g, ""), 10) || 0; };
  var fmt = function (n) { return n.toLocaleString("en-US"); };
  var money = function (n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var dataEl = document.getElementById("billing-alert-data");
  if (!dataEl) return;
  var saved = JSON.parse(dataEl.textContent);
  var toUsd = function (a) { return { value: parseFloat(String(a.value).replace(/[^\d.]/g, "")) || 0 }; };
  saved.overage = saved.overage.map(toUsd);

  /* ── Summaries on the overview ────────────────────────────────────── */

  var label = {
    overage: function (a) { return "$" + fmt(a.value); },
    recipients: function (r) { return r.email; }
  };
  var KEYS = ["low", "overage", "recipients"];
  // "a", "a and b", "a, b, and c"
  function list(items) {
    if (items.length < 3) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }

  function isMetered() { return document.body.dataset.billingType === "metered"; }
  // Empty data = a new account: no alerts, Auto Top-Up off.
  function isNew() { return document.body.dataset.billingData === "empty"; }
  var fresh = { low: [], overage: [], recipients: [] };
  function store() { return isNew() ? fresh : saved; }

  // Low balance: % of the grant used and / or credits left. Metered measures both against included credits.
  function lowSummary(items) {
    var credits = isMetered() ? "included credits" : "credits";
    var of = function (kind) { return items.filter(function (a) { return a.kind === kind; }); };
    var parts = [];
    if (of("percent").length) parts.push(list(of("percent").map(function (a) { return a.value + "%"; })) + " of " + credits + " used");
    if (of("remaining").length) parts.push(list(of("remaining").map(function (a) { return fmt(a.value); })) + " " + credits + " left");
    return "Notify at " + parts.join(" and at ") + ".";
  }

  // One summary line per Alerts row.
  function renderSummary() {
    var src = store();
    var lines = {
      low: src.low.length ? lowSummary(src.low) : "No thresholds yet.",
      overage: src.overage.length ? "Notify when estimated overage reaches " + list(src.overage.map(label.overage)) + "." : "No overage thresholds yet.",
      // Admins always get alerts; the list adds extra addresses. The caption is the same with an empty list.
      recipients: "Notify all admins and recipients from this list."
    };
    KEYS.forEach(function (key) {
      var el = document.querySelector('[data-alerts-summary="' + key + '"]');
      if (el) el.textContent = lines[key];
    });
  }

  /* ── List editors ─────────────────────────────────────────────────── */

  function editor(key) {
    var box = document.querySelector('[data-edit-list="' + key + '"]');
    return {
      box: box,
      modal: box.closest(".m__modal-backdrop"),
      rows: box.querySelector("[data-edit-rows]"),
      add: box.querySelector("[data-edit-add]"),
      error: box.querySelector("[data-edit-error]"),
      max: parseInt(box.dataset.max, 10)
    };
  }

  function addRow(key, item) {
    var ed = editor(key);
    var li = ed.box.querySelector("[data-edit-template]").content.firstElementChild.cloneNode(true);
    // Recipients are plain email fields, like the threshold amounts.
    if (item) li.querySelector("[data-edit-value]").value = key === "recipients" ? item.email : fmt(item.value);
    if (item && item.kind) setKind(li.querySelector(".billing-edit-list__unit"), item.kind);
    ed.rows.appendChild(li);
    syncAdd(key);
    return li;
  }

  // Threshold type dropdown: keeps the hidden select, the trigger text and the check in sync.
  function setKind(unit, kind, list) {
    unit.querySelector("[data-edit-kind]").value = kind;
    (list || unit).querySelectorAll("[data-sort-option]").forEach(function (opt) {
      var on = opt.dataset.sortOption === kind;
      opt.setAttribute("aria-checked", String(on));
      if (on) unit.querySelector("[data-edit-kind-label]").textContent = opt.textContent.trim();
    });
  }
  // menu-button.js moves the open list to <body>; it remembers the unit it came from.
  document.addEventListener("click", function (e) {
    var opt = e.target.closest(".billing-unit-list [data-sort-option]");
    if (!opt) return;
    var list = opt.closest(".billing-unit-list");
    setKind(list._menuButtonOriginalParent || list.parentNode, opt.dataset.sortOption, list);
  });

  function syncAdd(key) {
    var ed = editor(key);
    ed.add.disabled = ed.rows.children.length >= ed.max;
  }

  function open(key) {
    var ed = editor(key);
    ed.rows.innerHTML = "";
    ed.error.hidden = true;
    store()[key].forEach(function (item) { addRow(key, item); });
    if (!store()[key].length) addRow(key);
  }

  function fail(ed, message, input) {
    ed.error.textContent = message;
    ed.error.hidden = false;
    if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
    return null;
  }

  // Read rows back; empty rows are dropped, like Claude’s list.
  function collect(key) {
    var ed = editor(key);
    var out = [];
    var seen = {};
    ed.error.hidden = true;
    ed.rows.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var rows = Array.prototype.slice.call(ed.rows.children);
    for (var i = 0; i < rows.length; i++) {
      var li = rows[i];
      var input = li.querySelector("[data-edit-value]");
      var raw = input.value.trim();
      if (!raw) continue;
      if (key === "recipients") {
        if (!EMAIL.test(raw)) return fail(ed, "Enter a valid email address.", input);
        if (seen[raw]) return fail(ed, raw + " is already on the list.", input);
        seen[raw] = true;
        out.push({ email: raw });
        continue;
      }
      var value = parse(raw);
      var kindEl = li.querySelector("[data-edit-kind]");
      var kind = kindEl ? kindEl.value : "";
      if (!value) return fail(ed, "Enter an amount greater than 0.", input);
      if (kind === "percent" && value > 100) return fail(ed, "Enter a percentage from 1 to 100.", input);
      if (seen[kind + value]) return fail(ed, "This threshold is already on the list.", input);
      seen[kind + value] = true;
      out.push(kind ? { kind: kind, value: value } : { value: value });
    }
    // Earliest warning first: % used ascending, then credits left descending.
    if (key === "low") out.sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === "percent" ? -1 : 1;
      return a.kind === "percent" ? a.value - b.value : b.value - a.value;
    });
    else if (key !== "recipients") out.sort(function (a, b) { return a.value - b.value; });
    return out;
  }

  KEYS.forEach(function (key) {
    var ed = editor(key);
    ed.add.addEventListener("click", function () {
      var li = addRow(key);
      li.querySelector("[data-edit-value]").focus();
    });
    ed.rows.addEventListener("click", function (e) {
      var remove = e.target.closest("[data-edit-remove]");
      if (!remove) return;
      remove.closest("li").remove();
      syncAdd(key);
    });
  });

  /* ── One modal, one list at a time: Usage alerts · Overage alerts (Metered) · Recipients ── */

  var alertsModal = document.getElementById("modal-billing-alerts");
  var TITLES = { low: "Low balance", overage: "Overage threshold", recipients: "Recipients" };
  var SAVED = { low: "Low-balance alerts saved.", overage: "Overage threshold saved.", recipients: "Recipients saved." };
  var current = "low";

  function openAlerts(key) {
    current = key || "low";
    open(current);
    KEYS.forEach(function (k) { editor(k).box.hidden = k !== current; });
    alertsModal.querySelector("[data-alerts-title]").textContent = TITLES[current];
  }

  document.querySelectorAll("[data-alerts-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openAlerts(btn.dataset.alertsOpen);
      window.M.openModal(alertsModal);
    });
  });

  alertsModal.querySelector("[data-alerts-save]").addEventListener("click", function () {
    var list = collect(current);
    if (!list) return;
    store()[current] = list;
    renderSummary();
    window.M.closeModal(alertsModal);
    toast(SAVED[current]);
  });

  document.addEventListener("billing:change", renderSummary);
  renderSummary();

  /* ── Auto-recharge (Pay/Go) ───────────────────────────────────────── */

  var recharge = document.getElementById("modal-billing-recharge");
  var toggle = recharge.querySelector("[data-billing-recharge-toggle]");
  var fields = recharge.querySelector("[data-billing-recharge-fields]");
  var threshold = recharge.querySelector("#br-threshold");
  var amount = recharge.querySelector("[data-billing-recharge-amount]");
  var rechargeError = recharge.querySelector("[data-billing-recharge-error]");
  var rechargeSaved = null;

  function rechargeState() { return { on: toggle.checked, threshold: threshold.value, amount: amount.value }; }

  function renderRecharge() {
    fields.disabled = !toggle.checked;
    recharge.querySelector("[data-billing-recharge-price]").textContent = money(parse(amount.value) * 0.01);
    rechargeError.hidden = true;
    amount.removeAttribute("aria-invalid");
  }

  var autoWidget = document.querySelector("[data-autotopup]");

  // Widget state: off → Enable button; on / failed → rule and payment rows.
  function setAutoTopUp(value) { if (autoWidget) autoWidget.dataset.autotopup = value; }
  function autoTopUpFromScenario() {
    var sc = document.body.dataset.billingScenario;
    setAutoTopUp(isNew() || sc === "usage-stopped" ? "off" : sc === "failed-recharge" ? "failed" : "on");
  }

  document.querySelectorAll('[data-modal-open="modal-billing-recharge"]').forEach(function (btn) {
    btn.addEventListener("click", function () { openRecharge(btn.hasAttribute("data-autotopup-enable")); });
  });

  function openRecharge(enable) {
    if (!rechargeSaved) {
      rechargeSaved = rechargeState();
      rechargeSaved.on = !isNew() && document.body.dataset.billingScenario !== "usage-stopped";
    }
    toggle.checked = enable || rechargeSaved.on;
    threshold.value = rechargeSaved.threshold;
    amount.value = rechargeSaved.amount;
    renderRecharge();
  }

  // A new prototype scenario starts from its own recharge state.
  document.addEventListener("billing:change", function () { rechargeSaved = null; autoTopUpFromScenario(); });
  autoTopUpFromScenario();
  toggle.addEventListener("change", renderRecharge);
  amount.addEventListener("input", renderRecharge);

  recharge.querySelector("[data-billing-recharge-save]").addEventListener("click", function () {
    if (toggle.checked && parse(amount.value) < 1000) {
      rechargeError.hidden = false;
      amount.setAttribute("aria-invalid", "true");
      amount.focus();
      return;
    }
    rechargeSaved = rechargeState();
    document.querySelector('[data-recharge-summary="threshold"]').textContent = threshold.value;
    document.querySelector('[data-recharge-summary="amount"]').textContent = amount.value;
    var wasOn = autoWidget && autoWidget.dataset.autotopup !== "off";
    setAutoTopUp(toggle.checked ? "on" : "off");
    window.M.closeModal(recharge);
    toast(!toggle.checked ? "Auto Top-Up turned off." : wasOn ? "Auto Top-Up saved." : "Auto Top-Up enabled.");
  });

  document.addEventListener("input", function (e) {
    if (!e.target.matches("[data-billing-number]")) return;
    var digits = e.target.value.replace(/\D/g, "");
    e.target.value = digits ? fmt(parseInt(digits, 10)) : "";
  });

  /* ── Deep links from banners and other pages: #recharge, #overage-alerts ── */

  var HASH_MODALS = { "#top-up": "modal-billing-topup", "#recharge": "modal-billing-recharge", "#overage-alerts": "modal-billing-alerts" };

  // Each deep link only works for the customer types that have the feature.
  var HASH_TYPES = { "#top-up": ["contracting", "paygo"], "#recharge": ["paygo"], "#overage-alerts": ["metered"] };

  function openByHash(hash) {
    var id = HASH_MODALS[hash];
    if (!id || document.body.dataset.billingRole === "viewer") return false;
    if (HASH_TYPES[hash].indexOf(document.body.dataset.billingType) < 0) return false;
    if (hash === "#overage-alerts") {
      openAlerts("overage");
      window.M.openModal(alertsModal);
      return true;
    }
    var triggers = [].slice.call(document.querySelectorAll('[data-modal-open="' + id + '"]'));
    var trigger = triggers.filter(function (t) { return t.offsetParent; })[0] || triggers[0];
    if (trigger) trigger.click();
    else window.M.openModal(document.getElementById(id));
    return true;
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !HASH_MODALS[url.hash]) return;
    if (openByHash(url.hash)) e.preventDefault();
  });

  if (HASH_MODALS[location.hash]) {
    var hash = location.hash;
    history.replaceState(null, "", location.pathname + location.search);
    setTimeout(function () { openByHash(hash); }, 0);
  }
})();
