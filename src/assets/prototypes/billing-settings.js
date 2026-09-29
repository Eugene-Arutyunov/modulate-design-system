/* Billing › Alerts & recharge: auto-recharge form, alert thresholds, overage alerts, recipients. */
(function () {
  var toast = window.billingToast || function () {};
  var parse = function (v) { return parseInt(String(v).replace(/\D/g, ""), 10) || 0; };
  var fmt = function (n) { return n.toLocaleString("en-US"); };
  var MAX_ALERTS = 5;

  function isAdmin() { return document.body.dataset.billingRole !== "viewer"; }

  /* ── Role + scenario sync ─────────────────────────────────────────── */

  var toggle = document.querySelector("[data-billing-recharge-toggle]");
  var fields = document.querySelector("[data-billing-recharge-fields]");
  var saveBtn = document.querySelector("[data-billing-save]");
  var resetBtn = document.querySelector("[data-billing-reset]");
  var amountInput = document.querySelector("[data-billing-recharge-amount]");
  var thresholdInput = document.getElementById("bs-threshold");
  var saved = {};

  function snapshot() {
    return { on: toggle.checked, threshold: thresholdInput.value, amount: amountInput.value };
  }

  function sync() {
    var admin = isAdmin();
    document.querySelectorAll("[data-admin-control]").forEach(function (el) { el.disabled = !admin; });
    if (toggle) {
      toggle.checked = document.body.dataset.billingScenario !== "usage-stopped";
      saved = snapshot();
      render();
    }
  }

  function render() {
    if (!toggle) return;
    document.querySelector("[data-billing-recharge-state]").textContent = toggle.checked ? "On" : "Off";
    fields.disabled = !toggle.checked || !isAdmin();
    var credits = parse(amountInput.value);
    document.querySelector("[data-billing-recharge-price]").textContent =
      "$" + (credits * 0.01).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var invalid = toggle.checked && credits < 1000;
    document.querySelector("[data-billing-recharge-error]").hidden = !invalid;
    amountInput.setAttribute("aria-invalid", String(invalid));
    var now = snapshot();
    var dirty = now.on !== saved.on || now.threshold !== saved.threshold || now.amount !== saved.amount;
    saveBtn.disabled = !dirty || invalid;
    resetBtn.disabled = !dirty;
  }

  if (toggle) {
    toggle.addEventListener("change", render);
    [thresholdInput, amountInput].forEach(function (input) { input.addEventListener("input", render); });
    saveBtn.addEventListener("click", function () {
      saved = snapshot();
      render();
      toast(toggle.checked ? "Auto-recharge saved." : "Auto-recharge turned off.");
    });
    resetBtn.addEventListener("click", function () {
      toggle.checked = saved.on;
      thresholdInput.value = saved.threshold;
      amountInput.value = saved.amount;
      render();
    });
  }

  document.addEventListener("input", function (e) {
    if (!e.target.matches("[data-billing-number]")) return;
    var digits = e.target.value.replace(/\D/g, "");
    e.target.value = digits ? fmt(parseInt(digits, 10)) : "";
  });

  document.addEventListener("billing:change", sync);
  sync();

  /* ── Low-balance alerts ───────────────────────────────────────────── */

  var list = document.querySelector("[data-billing-alert-list]");
  var modal = document.getElementById("modal-billing-alert");
  var valueInput = modal.querySelector("[data-billing-alert-value]");
  var suffix = modal.querySelector("[data-billing-alert-suffix]");
  var error = modal.querySelector("[data-billing-alert-error]");
  var editing = null;
  // Row templates, so a list can be rebuilt after every row is removed.
  var alertTemplate = list.firstElementChild.cloneNode(true);
  var overageTemplate = document.querySelector("[data-billing-overage-list] li").cloneNode(true);
  var recipientTemplate = document.querySelector("[data-billing-recipient-list] li").cloneNode(true);

  function kind() { return modal.querySelector('input[name="bs-alert-kind"]:checked').value; }

  function setKind(k) {
    modal.querySelector('input[name="bs-alert-kind"][value="' + k + '"]').checked = true;
    suffix.textContent = k === "percent" ? "% of credits used" : "credits remaining";
    valueInput.placeholder = k === "percent" ? "80" : "5,000";
  }

  modal.addEventListener("change", function (e) {
    if (e.target.name === "bs-alert-kind") { setKind(e.target.value); error.hidden = true; }
  });

  function openAlert(row) {
    editing = row;
    error.hidden = true;
    modal.querySelector(".m__modal__title span").textContent = row ? "Edit alert" : "Add low-balance alert";
    setKind(row ? row.dataset.kind : "percent");
    valueInput.value = row ? row.dataset.value : "";
    window.M.openModal(modal);
  }

  function labelFor(k, v) { return k === "percent" ? v + "% used" : v + " credits remaining"; }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-billing-alert-add]")) {
      if (list.children.length >= MAX_ALERTS) { toast("You can set up to " + MAX_ALERTS + " alerts."); return; }
      openAlert(null);
    }
    var edit = e.target.closest("[data-billing-alert-edit]");
    if (edit) openAlert(edit.closest("li"));
    var remove = e.target.closest("[data-billing-alert-remove], [data-billing-row-remove]");
    if (remove) {
      remove.closest("li").remove();
      toast("Removed.");
    }
  });

  modal.querySelector("[data-billing-alert-save]").addEventListener("click", function () {
    var k = kind();
    var v = parse(valueInput.value);
    var message = "";
    if (!v) message = "Enter a threshold.";
    else if (k === "percent" && (v < 1 || v > 100)) message = "Enter a percentage between 1 and 100.";
    var value = k === "percent" ? String(v) : fmt(v);
    Array.prototype.forEach.call(list.children, function (li) {
      if (li !== editing && li.dataset.kind === k && li.dataset.value === value) message = "An alert with this threshold already exists.";
    });
    if (message) {
      error.textContent = message;
      error.hidden = false;
      valueInput.setAttribute("aria-invalid", "true");
      return;
    }
    valueInput.removeAttribute("aria-invalid");
    var li = editing || alertTemplate.cloneNode(true);
    li.dataset.kind = k;
    li.dataset.value = value;
    li.querySelector("[data-billing-alert-label]").textContent = labelFor(k, value);
    li.querySelector("[data-billing-alert-kind]").textContent = k === "percent" ? "Percentage of credits used" : "Credits remaining";
    if (!editing) list.appendChild(li);
    window.M.closeModal(modal);
    toast(editing ? "Alert updated." : "Alert added.");
  });

  /* ── Overage alerts + recipients ──────────────────────────────────── */

  var overageModal = document.getElementById("modal-billing-overage");
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-billing-overage-add]")) window.M.openModal(overageModal);
  });
  overageModal.querySelector("[data-billing-overage-save]").addEventListener("click", function () {
    var input = overageModal.querySelector("[data-billing-overage-value]");
    var v = parse(input.value);
    if (!v) { input.setAttribute("aria-invalid", "true"); return; }
    var overageList = document.querySelector("[data-billing-overage-list]");
    var li = overageTemplate.cloneNode(true);
    li.querySelector("strong").textContent = "$" + fmt(v) + ".00 estimated overage";
    overageList.appendChild(li);
    input.value = "";
    window.M.closeModal(overageModal);
    toast("Overage alert added.");
  });

  var recipientModal = document.getElementById("modal-billing-recipient");
  recipientModal.querySelector("[data-billing-recipient-save]").addEventListener("click", function () {
    var input = recipientModal.querySelector("[data-billing-recipient-value]");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { input.setAttribute("aria-invalid", "true"); input.focus(); return; }
    input.removeAttribute("aria-invalid");
    var recipients = document.querySelector("[data-billing-recipient-list]");
    var li = recipientTemplate.cloneNode(true);
    li.querySelector("strong").textContent = input.value;
    li.querySelector("small").textContent = "Not a member";
    li.querySelector(".m__tag").className = "m__tag m__tag--muted";
    li.querySelector(".m__tag").textContent = "External";
    recipients.appendChild(li);
    input.value = "";
    window.M.closeModal(recipientModal);
    toast("Recipient added.");
  });
})();
