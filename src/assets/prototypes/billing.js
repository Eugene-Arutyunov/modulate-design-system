/*
 * Billing prototype controller.
 *
 * Prototype state is kept in the URL: ?type=contracting|paygo|metered
 * &role=admin|viewer &scenario=<id> &data=ready|loading|empty|error
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
        { id: "failed-recharge", label: "Failed recharge", used: 43800 },
        { id: "usage-stopped", label: "Usage stopped · recharge off", used: 50000 }
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

  var DAYS_ELAPSED = 18; // 12 Sep → 29 Sep (today)
  var PERIOD_START = new Date(2026, 8, 12);

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
    if (["ready", "loading", "empty", "error"].indexOf(data) < 0) data = "ready";
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
    renderChart();
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
      used: fmt(sc.used + overage),
      daily: fmt((sc.used + overage) / DAYS_ELAPSED),
      overageCredits: fmt(overage),
      overageCharge: usd(overage * (t.overageRate || 0))
    };
    document.querySelectorAll("[data-credits-after]").forEach(function (el) {
      el.dataset.creditsAfter = String(remaining);
    });
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      if (values[el.dataset.bind] != null) el.textContent = values[el.dataset.bind];
    });

    var level = pct >= 100 ? "full" : pct >= 90 ? "critical" : pct >= 75 ? "warning" : "ok";
    if (state.type === "metered" && pct >= 100) level = "metered";
    document.querySelectorAll("[data-billing-meter]").forEach(function (el) {
      el.dataset.level = level;
      el.style.setProperty("--value", pct + "%");
      el.setAttribute("aria-valuenow", pct);
    });

    var tag = "";
    if (state.scenario === "failed-recharge") tag = '<span class="m__tag m__tag--error">Recharge failed</span>';
    else if (level === "full") tag = '<span class="m__tag m__tag--error">Usage stopped</span>';
    else if (level === "metered") tag = '<span class="m__tag m__tag--secondary">Used up</span>';
    else if (level === "critical" || level === "warning") tag = '<span class="m__tag m__tag--warning billing-tag-warning">Low</span>';
    document.querySelectorAll("[data-bind-status]").forEach(function (el) { el.innerHTML = tag; });
  }

  /* ── Balance over time (Chart.js, same look as the dashboard chart) ── */

  var TODAY = new Date(2026, 8, 29);
  var DAY = 24 * 60 * 60 * 1000;
  var chart = null;

  function dayWeight(d) {
    // Deterministic weekday-shaped usage: weekends lighter.
    var i = Math.round((d - PERIOD_START) / DAY);
    var dow = d.getDay();
    return (dow === 0 || dow === 6 ? 0.55 : 1) * (0.8 + 0.4 * Math.abs(Math.sin(i * 1.7 + 0.4)));
  }

  // Balance story per type over the last 30 days: a starting balance, then
  // credit events (top-up, recharge, allocation reset) with the balance just
  // before each one. Usage between events is spread across days by weight, so
  // the line ends exactly at today's remaining balance.
  function balanceEvents() {
    var d = function (m, day) { return new Date(2026, m, day); };
    if (state.type === "contracting") {
      return { start: 150000, events: [
        { date: d(8, 3), before: 118000, after: 218000 },
        { date: d(8, 12), before: 86000, after: 500000 }
      ] };
    }
    if (state.type === "paygo") {
      return { start: 31000, events: [
        { date: d(8, 5), before: 9200, after: 59200 },
        { date: d(8, 20), before: 8400, after: 58400 }
      ] };
    }
    return { start: 34000, events: [{ date: d(8, 12), before: 6000, after: 100000 }] };
  }

  function balanceSeries(days) {
    var t = TYPES[state.type];
    var sc = scenarioOf(state);
    var remaining = Math.max(0, t.total - sc.used);
    var story = balanceEvents();
    var from = new Date(TODAY.getTime() - 29 * DAY);
    var dates = [];
    for (var i = 0; i < 30; i++) dates.push(new Date(from.getTime() + i * DAY));

    // Segments: [start value, end value, first day, last day]
    var points = [{ date: from, value: story.start }];
    story.events.forEach(function (e) {
      points.push({ date: new Date(e.date.getTime() - DAY), value: e.before, jumpTo: e.after });
    });
    points.push({ date: TODAY, value: remaining });

    var values = [];
    for (var p = 0; p < points.length - 1; p++) {
      var startVal = points[p].jumpTo != null ? points[p].jumpTo : points[p].value;
      var endVal = points[p + 1].value;
      var segDays = dates.filter(function (x) { return x > points[p].date && x <= points[p + 1].date; });
      if (p === 0) values.push(startVal);
      var weights = segDays.map(dayWeight);
      var sum = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
      var run = startVal;
      segDays.forEach(function (x, k) {
        run -= ((startVal - endVal) * weights[k]) / sum;
        values.push(Math.max(0, Math.round(run)));
      });
    }
    return { dates: dates.slice(-days), values: values.slice(-days) };
  }

  function chartDays() {
    var checked = document.querySelector("[data-billing-chart-period] input:checked");
    return checked && checked.value === "7" ? 7 : 30;
  }

  function shortDate(d) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function renderChart() {
    var canvas = document.querySelector("[data-billing-chart]");
    if (!canvas || typeof Chart === "undefined") return;
    if (chart) chart.destroy();

    var series = balanceSeries(chartDays());
    var style = getComputedStyle(body);
    var caption = style.getPropertyValue("--m__text-caption").trim();
    var grid = "color-mix(in srgb, " + style.getPropertyValue("--m__text").trim() + " 12%, transparent)";
    var base = style.getPropertyValue("--m__chart-default").trim();
    var rgba = function (a) {
      var m = base.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      return m ? "rgba(" + m[1] + ", " + m[2] + ", " + m[3] + ", " + a + ")" : base;
    };
    var scale = function () {
      return { ticks: { color: caption, font: { size: 11 }, maxRotation: 0 }, grid: { color: grid } };
    };
    var x = scale();
    var total = series.dates.length;
    var step = Math.max(1, Math.ceil(total / (canvas.parentNode.clientWidth < 480 ? 5 : 10)));
    x.ticks.autoSkip = false;
    x.ticks.callback = function (value, index) {
      if (index !== 0 && index !== total - 1 && index % step !== 0) return null;
      var dd = series.dates[index];
      var prev = series.dates[Math.max(0, index - step)];
      return index === 0 || dd.getMonth() !== prev.getMonth() ? shortDate(dd) : String(dd.getDate());
    };
    var y = Object.assign({ grace: "15%", beginAtZero: true }, scale());
    y.ticks.callback = function (v) { return v >= 1000 ? v / 1000 + "k" : v; };

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: series.dates.map(shortDate),
        datasets: [{
          label: "Balance",
          data: series.values,
          borderColor: "transparent",
          backgroundColor: function (ctx) {
            var area = ctx.chart.chartArea;
            if (!area) return rgba(0.35);
            var g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            g.addColorStop(0, rgba(0.35));
            g.addColorStop(0.67, rgba(0.35));
            g.addColorStop(1, rgba(0));
            return g;
          },
          fill: true,
          tension: 0.15,
          pointRadius: 0,
          pointHoverRadius: 2.5,
          pointHoverBackgroundColor: rgba(0.9),
          pointHoverBorderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
        scales: { x: x, y: y }
      }
    });

    var status = document.querySelector("[data-billing-chart-status]");
    if (status && !canvas._billingStatus) {
      canvas._billingStatus = true;
      canvas.addEventListener("mousemove", function (e) {
        var hit = chart.getElementsAtEventForMode(e, "index", { intersect: false }, true);
        status.textContent = hit.length
          ? chart.data.labels[hit[0].index] + " · " + fmt(chart.data.datasets[0].data[hit[0].index]) + " credits"
          : "";
      });
      canvas.addEventListener("mouseleave", function () { status.textContent = ""; });
    }
  }

  document.addEventListener("change", function (e) {
    if (e.target.closest("[data-billing-chart-period]")) renderChart();
  });

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
    // Click the collapsed label to expand (remembered); × collapses.
    var pinned = false;
    try { pinned = localStorage.getItem("billing-proto-open") === "1"; } catch (e) { /* ignore */ }
    function setOpen(v) {
      panel.classList.toggle("is-open", v);
      panel.querySelector(".billing-proto__open").setAttribute("aria-expanded", String(v));
    }
    function setPinned(v) {
      pinned = v;
      setOpen(v);
      try { localStorage.setItem("billing-proto-open", v ? "1" : "0"); } catch (e) { /* ignore */ }
    }
    setOpen(pinned);
    var trigger = panel.querySelector(".billing-proto__open");
    trigger.addEventListener("click", function () { setPinned(true); });
    panel.querySelector(".billing-proto__close").addEventListener("click", function () { setPinned(false); });
  }

  var toastTimer;
  function toast(message) {
    var el = document.querySelector(".billing-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "billing-toast";
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
    var retry = e.target.closest("[data-billing-retry]");
    if (retry) {
      var block = retry.closest("[data-billing-block]");
      block.dataset.force = "loading";
      setTimeout(function () { block.dataset.force = "ready"; }, 900);
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
