/*
 * Billing prototype controller.
 *
 * Prototype state is kept in the URL: ?type=contracting|paygo|metered
 * &role=admin|viewer &scenario=<id> &data=ready|loading|empty|error|page-error
 * CSS reads the body data attributes for type/role/data; this script fills
 * scenario numbers, toggles [data-when] blocks and wires the interactions.
 */
(function () {
  var body = document.body;
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var usd = function (n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  var TYPES = {
    contracting: {
      label: "Contracting",
      total: 500000,
      scenarios: [
        { id: "healthy", label: "Healthy · 42% used", used: 210000 },
        { id: "usage-75", label: "Banner · 75% used", used: 381000 },
        { id: "usage-90", label: "Banner · 90% used", used: 462000 },
        { id: "usage-stopped", label: "Usage stopped · 100%", used: 500000 }
      ]
    },
    paygo: {
      label: "Pay/Go",
      total: 50000,
      scenarios: [
        { id: "healthy", label: "Healthy · 38% used", used: 19000 },
        { id: "usage-75", label: "Banner · 75% used", used: 38000 },
        { id: "usage-90", label: "Banner · 90% used", used: 45500 },
        { id: "failed-recharge", label: "Failed Auto Top-Up", used: 43800 },
        { id: "usage-stopped", label: "Usage stopped · Auto Top-Up off", used: 50000 }
      ]
    },
    metered: {
      label: "Metered",
      total: 100000,
      overageRate: 0.012,
      scenarios: [
        { id: "healthy", label: "Healthy · 48% used", used: 48000 },
        { id: "usage-75", label: "Banner · 75% used", used: 77000 },
        { id: "usage-90", label: "Banner · 90% used", used: 93500 },
        { id: "now-metered", label: "Now in metered billing", used: 100000, overage: 18400 }
      ]
    }
  };


  /* ── State ─────────────────────────────────────────────────────────── */

  function readState() {
    var params = new URLSearchParams(location.search);
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem("billing-proto") || "{}"); } catch (e) { /* ignore */ }
    var type = params.get("type") || stored.type || "contracting";
    if (!TYPES[type]) type = "contracting";
    var scenario = params.get("scenario") || (stored.type === type && stored.scenario) || "healthy";
    if (!TYPES[type].scenarios.some(function (s) { return s.id === scenario; })) scenario = "healthy";
    var role = params.get("role") || stored.role || "admin";
    if (role !== "viewer") role = "admin";
    var data = params.get("data") || "ready";
    if (["ready", "loading", "empty", "error", "page-error"].indexOf(data) < 0) data = "ready";
    return { type: type, role: role, scenario: scenario, data: data };
  }

  var state = readState();

  function query(s) {
    var p = new URLSearchParams();
    p.set("type", s.type);
    if (s.scenario !== "healthy") p.set("scenario", s.scenario);
    if (s.role !== "admin") p.set("role", s.role);
    if (s.data !== "ready") p.set("data", s.data);
    return "?" + p.toString();
  }

  function saveState() {
    try {
      sessionStorage.setItem("billing-proto", JSON.stringify({ type: state.type, role: state.role, scenario: state.scenario }));
    } catch (e) { /* ignore */ }
    history.replaceState(null, "", location.pathname + query(state) + location.hash);
  }

  /* ── Apply ─────────────────────────────────────────────────────────── */

  function scenarioOf(s) {
    return TYPES[s.type].scenarios.filter(function (x) { return x.id === s.scenario; })[0];
  }

  function apply() {
    body.dataset.billingType = state.type;
    body.dataset.billingRole = state.role;
    body.dataset.billingScenario = state.scenario;
    body.dataset.billingData = state.data;

    document.querySelectorAll("[data-when]").forEach(function (el) {
      el.hidden = el.dataset.when.split(/\s+/).indexOf(state.scenario) < 0;
    });

    document.querySelectorAll("[data-billing-block]").forEach(function (el) {
      delete el.dataset.force;
    });

    bindNumbers();
    syncLinks();
    syncPanel();
    document.dispatchEvent(new CustomEvent("billing:change", { detail: state }));
  }

  function bindNumbers() {
    var t = TYPES[state.type];
    var sc = scenarioOf(state);
    var remaining = Math.max(0, t.total - sc.used);
    var pct = Math.min(100, Math.round((sc.used / t.total) * 100));
    var overage = sc.overage || 0;
    var values = {
      remaining: fmt(remaining),
      balance: remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      total: fmt(t.total),
      percent: pct + "%",
      overageCredits: fmt(overage),
      overageCharge: usd(overage * (t.overageRate || 0))
    };
    document.querySelectorAll("[data-credits-after]").forEach(function (el) {
      el.dataset.creditsAfter = String(remaining);
    });
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      if (values[el.dataset.bind] != null) el.textContent = values[el.dataset.bind];
    });

  }

  /* ── Links, panel, feedback ────────────────────────────────────────── */

  function syncLinks() {
    var q = query({ type: state.type, role: state.role, scenario: state.scenario, data: "ready" });
    document.querySelectorAll("a[data-billing-link]").forEach(function (a) {
      if (a.getAttribute("href").charAt(0) === "#") return;
      var url = new URL(a.getAttribute("href"), location.origin);
      a.setAttribute("href", url.pathname + q + url.hash);
    });
  }

  var panel = document.querySelector("[data-billing-proto]");

  // Wrap option text so CSS can reserve its bold width (no jump on selection).
  function wrapLabel(label) {
    var text = label.textContent.trim();
    Array.prototype.slice.call(label.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.remove();
    });
    var span = document.createElement("span");
    span.className = "billing-proto__text";
    span.dataset.text = text;
    span.textContent = text;
    label.appendChild(span);
  }

  // Every customer type's scenario list is rendered into one grid cell; only the
  // active one is visible, so the panel keeps the same size when the type changes.
  function buildPanel() {
    panel.querySelectorAll(".billing-proto__options label").forEach(wrapLabel);
    var stack = panel.querySelector("[data-billing-proto-scenario]");
    if (!stack) return; // Usage shows the Data group only
    Object.keys(TYPES).forEach(function (type) {
      var list = document.createElement("div");
      list.className = "billing-proto__options";
      list.dataset.type = type;
      TYPES[type].scenarios.forEach(function (sc) {
        var label = document.createElement("label");
        label.innerHTML = '<input type="radio" name="bp-scenario-' + type + '" value="' + sc.id + '" />' + sc.label;
        wrapLabel(label);
        list.appendChild(label);
      });
      stack.appendChild(list);
    });
  }

  function syncPanel() {
    if (!panel) return;
    panel.querySelectorAll("[data-billing-proto-scenario] > [data-type]").forEach(function (list) {
      var active = list.dataset.type === state.type;
      list.classList.toggle("is-active", active);
      list.inert = !active;
    });
    ["type", "role", "data"].forEach(function (k) {
      var input = panel.querySelector('input[name="bp-' + k + '"][value="' + state[k] + '"]');
      if (input) input.checked = true;
    });
    var scenario = panel.querySelector('input[name="bp-scenario-' + state.type + '"][value="' + state.scenario + '"]');
    if (scenario) scenario.checked = true;
  }

  if (panel) {
    buildPanel();
    panel.addEventListener("change", function (e) {
      var name = e.target.name.indexOf("bp-scenario-") === 0 ? "bp-scenario" : e.target.name;
      var key = { "bp-type": "type", "bp-role": "role", "bp-data": "data", "bp-scenario": "scenario" }[name];
      if (!key) return;
      state[key] = e.target.value;
      if (key === "type") state.scenario = "healthy";
      saveState();
      apply();
    });
    // Collapsed by default. Click the label to expand (remembered for this tab only); × collapses.
    var pinned = false;
    try { pinned = sessionStorage.getItem("billing-proto-open") === "1"; } catch (e) { /* ignore */ }
    function setOpen(v) {
      panel.classList.toggle("is-open", v);
      panel.querySelector(".billing-proto__open").setAttribute("aria-expanded", String(v));
    }
    function setPinned(v) {
      pinned = v;
      setOpen(v);
      try { sessionStorage.setItem("billing-proto-open", v ? "1" : "0"); } catch (e) { /* ignore */ }
    }
    setOpen(pinned);
    var trigger = panel.querySelector(".billing-proto__open");
    trigger.addEventListener("click", function () { setPinned(true); });
    panel.querySelector(".billing-proto__close").addEventListener("click", function () { setPinned(false); });
  }

  var toastTimer;
  function toast(message) {
    var el = document.querySelector(".m__toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "m__toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2600);
  }
  window.billingToast = toast;

  document.addEventListener("click", function (e) {
    // Info banners can be dismissed; any state change (apply) brings the matching one back.
    var dismiss = e.target.closest("[data-billing-dismiss]");
    if (dismiss) {
      dismiss.closest(".billing-banner").hidden = true;
      return;
    }

    // Page error: one Try again reloads every block at once.
    if (e.target.closest("[data-billing-retry-all]")) {
      state.data = "loading";
      saveState();
      apply();
      setTimeout(function () {
        if (state.data !== "loading") return;
        state.data = "ready";
        saveState();
        apply();
      }, 900);
      return;
    }
    var retry = e.target.closest("[data-billing-retry]");
    if (retry) {
      var block = retry.closest("[data-billing-block]");
      var forced = function (value) {
        block.dataset.force = value;
        block.dispatchEvent(new CustomEvent("billing:block", { bubbles: true }));
      };
      forced("loading");
      setTimeout(function () { forced("ready"); }, 900);
      return;
    }
    if (e.target.closest("[data-billing-stripe]")) {
      e.preventDefault();
      toast("Opens the Stripe customer portal in a new tab (handled by Stripe).");
      return;
    }
    var toastTrigger = e.target.closest("[data-billing-toast]");
    if (toastTrigger) {
      toast(toastTrigger.dataset.billingToast);
      return;
    }
    var pdf = e.target.closest("[data-billing-pdf]");
    if (pdf) {
      e.preventDefault();
      toast("Opening " + (pdf.dataset.billingPdf || "document") + " (PDF)…");
    }
  });

  window.billingState = function () { return state; };

  saveState();
  apply();
})();
