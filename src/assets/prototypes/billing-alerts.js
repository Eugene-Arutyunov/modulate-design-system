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
  saved.low = saved.low.map(function (a) { return { kind: a.kind, value: parse(a.value) }; });
  saved.overage = saved.overage.map(function (a) { return { value: parseFloat(String(a.value).replace(/[^\d.]/g, "")) || 0 }; });

  /* ── Summaries on the overview ────────────────────────────────────── */

  var label = {
    low: function (a) { return a.kind === "percent" ? a.value + "% used" : fmt(a.value) + " credits left"; },
    overage: function (a) { return money(a.value); },
    recipients: function (r) { return r.name || r.email; }
  };
  var KEYS = ["low", "overage", "recipients"];

  function isMetered() { return document.body.dataset.billingType === "metered"; }

  // One sentence for the whole Email alerts row.
  function renderSummary() {
    var el = document.querySelector("[data-alerts-summary]");
    if (!el) return;
    var n = saved.recipients.length;
    var who = n ? n + (n === 1 ? " recipient" : " recipients") : "account admins";
    var parts = [];
    if (saved.low.length) parts.push("at " + saved.low.map(label.low).join(", "));
    if (isMetered() && saved.overage.length) parts.push("when overage reaches " + saved.overage.map(label.overage).join(", "));
    el.textContent = parts.length ? "Email " + who + " " + parts.join(" and ") + "." : "No alerts set.";
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
      var kind = li.querySelector("[data-edit-kind]");
      if (kind) kind.value = item.kind;
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
    saved[key].forEach(function (item) { addRow(key, item); });
    if (!saved[key].length) addRow(key);
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
      var kind = key === "low" ? li.querySelector("[data-edit-kind]").value : "usd";
      if (kind === "percent" && (value < 1 || value > 100)) return fail(ed, "Enter a percentage between 1 and 100.", input);
      if (!value) return fail(ed, "Enter a number greater than 0.", input);
      if (seen[kind + value]) return fail(ed, "This threshold is already on the list.", input);
      seen[kind + value] = true;
      out.push(key === "low" ? { kind: kind, value: value } : { value: value });
    }
    if (key === "low") {
      // Percent thresholds first, ascending; then credits left, descending.
      out.sort(function (a, b) {
        if (a.kind !== b.kind) return a.kind === "percent" ? -1 : 1;
        return a.kind === "percent" ? a.value - b.value : b.value - a.value;
      });
    }
    if (key === "overage") out.sort(function (a, b) { return a.value - b.value; });
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

  /* ── Tabs: Alerts · Overage (Metered) · Recipients ─────────────────── */

  var alertsModal = document.getElementById("modal-billing-alerts");
  var tabs = Array.prototype.slice.call(alertsModal.querySelectorAll("[data-alerts-tab]"));

  function selectTab(key) {
    tabs.forEach(function (tab) {
      var on = tab.dataset.alertsTab === key;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
    });
  }

  alertsModal.querySelector("[role=tablist]").addEventListener("click", function (e) {
    var tab = e.target.closest("[data-alerts-tab]");
    if (tab) selectTab(tab.dataset.alertsTab);
  });
  alertsModal.querySelector("[role=tablist]").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var visible = tabs.filter(function (t) { return t.offsetParent !== null; });
    var i = visible.indexOf(document.activeElement);
    var next = visible[(i + (e.key === "ArrowRight" ? 1 : -1) + visible.length) % visible.length];
    selectTab(next.dataset.alertsTab);
    next.focus();
  });

  function openAlerts(key) {
    KEYS.forEach(open);
    selectTab(key || "low");
  }

  document.querySelectorAll('[data-modal-open="modal-billing-alerts"]').forEach(function (btn) {
    btn.addEventListener("click", function () { openAlerts(); });
  });

  alertsModal.querySelector("[data-alerts-save]").addEventListener("click", function () {
    var next = {};
    for (var i = 0; i < KEYS.length; i++) {
      var key = KEYS[i];
      if (key === "overage" && !isMetered()) { next[key] = saved[key]; continue; }
      var list = collect(key);
      if (!list) { selectTab(key); return; } // show the tab with the error
      next[key] = list;
    }
    KEYS.forEach(function (key) { saved[key] = next[key]; });
    renderSummary();
    window.M.closeModal(alertsModal);
    toast("Email alerts saved.");
  });

  document.addEventListener("billing:change", renderSummary);
  renderSummary();

  /* ── Monthly spend limit: a cap only; usage progress is on the balance card ── */

  var limits = saved.limit;
  var limitModal = document.getElementById("modal-billing-limit");
  var limitInput = limitModal.querySelector("[data-limit-value]");
  var limitError = limitModal.querySelector("[data-limit-error]");

  function limitOf() { return limits[document.body.dataset.billingType] || limits.contracting; }

  function renderLimit() {
    var l = limitOf();
    var bind = function (k) { return document.querySelector('[data-spend-bind="' + k + '"]'); };
    bind("limit").textContent = l.limit
      ? fmt(l.limit) + " credits · " + fmt(l.spent) + " used this month"
      : "No limit. Usage isn’t capped.";
    bind("action").textContent = l.limit ? "Adjust limit" : "Set limit";
  }

  document.querySelectorAll('[data-modal-open="modal-billing-limit"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var l = limitOf();
      limitInput.value = l.limit ? fmt(l.limit) : "";
      limitInput.removeAttribute("aria-invalid");
      limitError.hidden = true;
      limitModal.querySelector(".m__modal__title span").textContent = l.limit ? "Edit spend limit" : "Set spend limit";
      limitModal.querySelector("[data-limit-remove]").hidden = !l.limit;
      limitModal.querySelector("[data-limit-save]").textContent = l.limit ? "Update limit" : "Set limit";
    });
  });

  limitModal.querySelector("[data-limit-save]").addEventListener("click", function () {
    var v = parse(limitInput.value);
    if (!v) {
      limitError.textContent = "Enter a limit greater than 0.";
      limitError.hidden = false;
      limitInput.setAttribute("aria-invalid", "true");
      limitInput.focus();
      return;
    }
    var had = !!limitOf().limit;
    limitOf().limit = v;
    renderLimit();
    window.M.closeModal(limitModal);
    toast(v <= limitOf().spent ? "Limit saved. This month’s usage already reached it, so usage is paused." : had ? "Spend limit updated." : "Spend limit set.");
  });

  limitModal.querySelector("[data-limit-remove]").addEventListener("click", function () {
    limitOf().limit = null;
    renderLimit();
    window.M.closeModal(limitModal);
    toast("Spend limit removed.");
  });

  document.addEventListener("billing:change", renderLimit);
  renderLimit();

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
    setAutoTopUp(sc === "usage-stopped" ? "off" : sc === "failed-recharge" ? "failed" : "on");
  }

  document.querySelectorAll('[data-modal-open="modal-billing-recharge"]').forEach(function (btn) {
    btn.addEventListener("click", function () { openRecharge(btn.hasAttribute("data-autotopup-enable")); });
  });

  function openRecharge(enable) {
    if (!rechargeSaved) {
      rechargeSaved = rechargeState();
      rechargeSaved.on = document.body.dataset.billingScenario !== "usage-stopped";
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
      window.M.openModal(alertsModal);
      openAlerts("overage");
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
