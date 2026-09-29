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
  saved.low = saved.low.map(toUsd);
  saved.overage = saved.overage.map(function (a) { return { value: parseFloat(String(a.value).replace(/[^\d.]/g, "")) || 0 }; });

  /* ── Summaries on the overview ────────────────────────────────────── */

  var label = {
    low: function (a) { return "$" + fmt(a.value); },
    overage: function (a) { return "$" + fmt(a.value); },
    recipients: function (r) { return r.name || r.email; }
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

  // Spend is counted over each type's own window: contract period, since the last top-up, billing period.
  var SPEND = { contracting: "spend this contract period", paygo: "spend since the last top-up", metered: "spend this billing period" };

  // One summary line per Alerts row.
  function renderSummary() {
    var src = store();
    var lines = {
      low: src.low.length ? "Notify when " + SPEND[document.body.dataset.billingType] + " reaches " + list(src.low.map(label.low)) + "." : "No thresholds yet.",
      overage: src.overage.length ? "Notify when estimated overage reaches " + list(src.overage.map(label.overage)) + "." : "No overage thresholds yet.",
      recipients: src.recipients.length ? list(src.recipients.map(label.recipients)) + "." : "Account admins."
    };
    KEYS.forEach(function (key) {
      var el = document.querySelector('[data-alerts-summary="' + key + '"]');
      if (el) el.textContent = lines[key];
      var btn = document.querySelector('[data-alerts-open="' + key + '"]');
      if (btn) btn.textContent = key !== "recipients" && !src[key].length ? "Add" : "Edit";
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
    var member = key === "recipients" && item && item.name !== undefined && item.role;
    var tpl = ed.box.querySelector(member ? "[data-edit-member-template]" : "[data-edit-template]");
    var li = tpl.content.firstElementChild.cloneNode(true);
    if (member) {
      li.dataset.email = item.email;
      li.querySelector("[data-member-name]").textContent = item.name || item.email;
      li.querySelector("[data-member-email]").textContent = item.name ? item.email : "Not a member";
      var tag = li.querySelector("[data-member-role]");
      tag.textContent = item.role;
      tag.classList.add(item.role === "Admin" ? "m__tag--success" : "m__tag--muted");
    } else if (item) {
      li.querySelector("[data-edit-value]").value = fmt(item.value);
    }
    ed.rows.appendChild(li);
    syncAdd(key);
    return li;
  }

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
      if (li.dataset.email) {
        var member = saved.recipients.filter(function (r) { return r.email === li.dataset.email; })[0];
        seen[member.email] = true;
        out.push(member);
        continue;
      }
      var input = li.querySelector("[data-edit-value]");
      var raw = input.value.trim();
      if (!raw) continue;
      if (key === "recipients") {
        if (!EMAIL.test(raw)) return fail(ed, "Enter a valid email address.", input);
        if (seen[raw]) return fail(ed, raw + " is already on the list.", input);
        seen[raw] = true;
        out.push({ name: "", email: raw, role: "External" });
        continue;
      }
      var value = parse(raw);
      if (!value) return fail(ed, "Enter an amount greater than 0.", input);
      if (seen[value]) return fail(ed, "This threshold is already on the list.", input);
      seen[value] = true;
      out.push({ value: value });
    }
    if (key !== "recipients") out.sort(function (a, b) { return a.value - b.value; });
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
  var TITLES = { low: "Spend limits", overage: "Overage threshold", recipients: "Recipients" };
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
    toast(TITLES[current] + " saved.");
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

  function openByHash(hash) {
    var id = HASH_MODALS[hash];
    if (!id || document.body.dataset.billingRole === "viewer") return false;
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
