(function () {
  "use strict";

  var charts = {
    creditBalance: null,
    usageByModel: null,
    requestStatus: null,
  };

  var fullData = null;

  function dayKey(isoString) {
    return isoString.slice(0, 10);
  }

  function cssVar(style, name) {
    return style.getPropertyValue(name).trim();
  }

  function rgbToRgba(rgbStr, alpha) {
    var match = rgbStr.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return rgbStr;
    return (
      "rgba(" + match[1] + ", " + match[2] + ", " + match[3] + ", " + alpha + ")"
    );
  }

  function lightenColor(rgbStr, factor) {
    var match = rgbStr.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return rgbStr;
    var r = Math.round(parseInt(match[1]) + (255 - parseInt(match[1])) * factor);
    var g = Math.round(parseInt(match[2]) + (255 - parseInt(match[2])) * factor);
    var b = Math.round(parseInt(match[3]) + (255 - parseInt(match[3])) * factor);
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  function readThemeColors() {
    var style = getComputedStyle(document.body);
    var textColor = cssVar(style, "--m__text-color");
    return {
      text: cssVar(style, "--m__text-caption-color"),
      grid: "color-mix(in srgb, " + textColor + " 12%, transparent)",
      chartDefault: cssVar(style, "--m__chart-default-color"),
      modelColors: [
        cssVar(style, "--m__chart-model-1-color"),
        cssVar(style, "--m__chart-model-2-color"),
        cssVar(style, "--m__chart-model-3-color"),
      ],
      statusSuccess: cssVar(style, "--m__chart-status-success-color"),
      statusClientError: cssVar(style, "--m__chart-status-client-error-color"),
      statusServerError: cssVar(style, "--m__chart-status-server-error-color"),
      statusProcessing: cssVar(style, "--m__chart-status-processing-color"),
    };
  }

  function baseScaleOptions(theme) {
    return {
      ticks: { color: theme.text, font: { size: 11 }, maxRotation: 0 },
      grid: { color: theme.grid },
    };
  }

  function formatDateTick(dayStr) {
    var d = new Date(dayStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function xScaleOptions(theme, sortedDays, extra) {
    var base = baseScaleOptions(theme);
    var total = sortedDays.length;
    var maxLabels = 10;
    var step = Math.max(1, Math.ceil(total / maxLabels));

    base.ticks.autoSkip = false;
    base.ticks.callback = function (value, index) {
      var isFirst = index === 0;
      var isLast = index === total - 1;
      var isStep = index % step === 0;
      if (!isFirst && !isLast && !isStep) return null;

      var d = new Date(sortedDays[index] + "T00:00:00");
      if (isFirst) return formatDateTick(sortedDays[index]);

      var prevIdx = isStep ? index - step : Math.floor(index / step) * step;
      if (prevIdx < 0) prevIdx = 0;
      var prevD = new Date(sortedDays[prevIdx] + "T00:00:00");
      if (d.getMonth() !== prevD.getMonth()) {
        return formatDateTick(sortedDays[index]);
      }
      return String(d.getDate());
    };

    if (extra) {
      for (var k in extra) base[k] = extra[k];
    }
    return base;
  }

  function periodCutoff(days) {
    var anchor =
      fullData && fullData.fetchedAt ? new Date(fullData.fetchedAt) : new Date();
    return new Date(anchor.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  function filterByPeriod(dataPoints, days) {
    if (!days) return dataPoints;
    var cutoff = periodCutoff(days);
    return dataPoints.filter(function (dp) {
      return dp.period >= cutoff;
    });
  }

  function creditHistoryForPeriod(creditHistory, days) {
    if (!creditHistory) return null;
    var allPoints = creditHistory.data_points;
    if (!days) {
      return {
        starting_balance: creditHistory.starting_balance,
        data_points: allPoints,
      };
    }
    var cutoff = periodCutoff(days);
    var priorSum = 0;
    var filtered = [];
    for (var i = 0; i < allPoints.length; i++) {
      if (allPoints[i].period < cutoff) {
        priorSum += allPoints[i].net_delta;
      } else {
        filtered.push(allPoints[i]);
      }
    }
    return {
      starting_balance: creditHistory.starting_balance + priorSum,
      data_points: filtered,
    };
  }

  function daysFromToggle(chartName) {
    var toggle = document.querySelector(
      '.m__segmented-control[data-chart="' + chartName + '"]'
    );
    if (!toggle) return 7;
    var checked = toggle.querySelector("input:checked");
    return checked && checked.value === "30d" ? 30 : 7;
  }

  // --- Credit Balance status bar ---

  function attachStatusBar(canvas, getChart, formatFn) {
    if (canvas._statusBarAttached) return;
    canvas._statusBarAttached = true;

    var statusBar = canvas.parentNode.parentNode.querySelector(".chart-status-bar");
    if (!statusBar) return;

    canvas.addEventListener("mousemove", function (e) {
      var chart = getChart();
      if (!chart) return;
      var elements = chart.getElementsAtEventForMode(
        e,
        "index",
        { intersect: false },
        true
      );
      statusBar.innerHTML = elements.length
        ? formatFn(elements[0].index, chart)
        : "";
    });

    canvas.addEventListener("mouseleave", function () {
      statusBar.innerHTML = "";
    });
  }

  function formatCreditStatusBar(index, chart) {
    var label = formatDateTick(chart.data.labels[index]);
    var value = chart.data.datasets[0].data[index];
    return label + " \u00b7 " + value.toLocaleString("en-US") + " credits";
  }

  // --- Bar chart custom legend (doubles as status bar on hover) ---

  function buildDefaultLegendHTML(chart) {
    var parts = [];
    for (var i = 0; i < chart.data.datasets.length; i++) {
      var ds = chart.data.datasets[i];
      var color = typeof ds.backgroundColor === "string" ? ds.backgroundColor : "";
      parts.push(
        '<span class="chart-legend-item">' +
        '<span class="chart-legend-dot" style="background:' + color + '"></span>' +
        ds.label +
        "</span>"
      );
    }
    return parts.join("");
  }

  function buildHoverLegendHTML(index, chart) {
    var label = formatDateTick(chart.data.labels[index]);
    var parts = ['<span class="chart-legend-date">' + label + "</span>"];
    for (var i = 0; i < chart.data.datasets.length; i++) {
      var ds = chart.data.datasets[i];
      var color = typeof ds.backgroundColor === "string" ? ds.backgroundColor : "inherit";
      parts.push(
        '<span class="chart-legend-item">' +
        ds.label +
        ' <span class="chart-legend-value" style="color:' + color + '">' + ds.data[index] + "</span>" +
        "</span>"
      );
    }
    return parts.join("");
  }

  function attachCustomLegend(canvas, getChart) {
    var legendEl = canvas.parentNode.parentNode.querySelector(".chart-legend");
    if (!legendEl) return;

    var chart = getChart();
    if (chart) legendEl.innerHTML = buildDefaultLegendHTML(chart);

    if (canvas._legendAttached) return;
    canvas._legendAttached = true;

    canvas.addEventListener("mousemove", function (e) {
      var c = getChart();
      if (!c) return;
      var elements = c.getElementsAtEventForMode(
        e,
        "index",
        { intersect: false },
        true
      );
      legendEl.innerHTML = elements.length
        ? buildHoverLegendHTML(elements[0].index, c)
        : buildDefaultLegendHTML(c);
    });

    canvas.addEventListener("mouseleave", function () {
      var c = getChart();
      if (c) legendEl.innerHTML = buildDefaultLegendHTML(c);
    });
  }

  // --- Credit Balance ---

  function renderCreditBalanceChart() {
    if (charts.creditBalance) charts.creditBalance.destroy();
    var canvas = document.getElementById("credit-balance-chart");
    if (!canvas || !fullData) return;

    var days = daysFromToggle("credit-balance");
    var history = creditHistoryForPeriod(fullData.creditHistory, days);
    if (!history || !history.data_points || !history.data_points.length) {
      canvas.parentNode.querySelector(".chart-empty").hidden = false;
      canvas.hidden = true;
      return;
    }
    canvas.parentNode.querySelector(".chart-empty").hidden = true;
    canvas.hidden = false;

    var dayMap = new Map();
    for (var i = 0; i < history.data_points.length; i++) {
      var dk = dayKey(history.data_points[i].period);
      dayMap.set(dk, (dayMap.get(dk) || 0) + history.data_points[i].net_delta);
    }

    var sortedDays = Array.from(dayMap.keys()).sort();
    var values = [];
    var running = history.starting_balance;
    for (var j = 0; j < sortedDays.length; j++) {
      running += dayMap.get(sortedDays[j]);
      values.push(+(running / 1000).toFixed(2));
    }

    var theme = readThemeColors();
    var baseRgb = theme.chartDefault;

    charts.creditBalance = new Chart(canvas, {
      type: "line",
      data: {
        labels: sortedDays,
        datasets: [
          {
            label: "Credit Balance",
            data: values,
            borderColor: "transparent",
            backgroundColor: function (context) {
              var solid = rgbToRgba(baseRgb, 0.35);
              var area = context.chart.chartArea;
              if (!area) return solid;
              var grad = context.chart.ctx.createLinearGradient(
                0,
                area.top,
                0,
                area.bottom
              );
              grad.addColorStop(0, solid);
              grad.addColorStop(0.67, solid);
              grad.addColorStop(1, rgbToRgba(baseRgb, 0));
              return grad;
            },
            fill: true,
            tension: 0.15,
            pointRadius: 0,
            pointHoverRadius: 2.5,
            pointHoverBackgroundColor: rgbToRgba(baseRgb, 0.9),
            pointHoverBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
        },
        scales: {
          x: xScaleOptions(theme, sortedDays),
          y: Object.assign({ grace: "25%" }, baseScaleOptions(theme)),
        },
      },
    });

    attachStatusBar(
      canvas,
      function () { return charts.creditBalance; },
      formatCreditStatusBar
    );
  }

  // --- Usage by Model ---

  function renderUsageByModelChart() {
    if (charts.usageByModel) charts.usageByModel.destroy();
    var canvas = document.getElementById("usage-by-model-chart");
    if (!canvas || !fullData) return;

    var days = daysFromToggle("usage-by-model");
    var dataPoints = filterByPeriod(
      fullData.usageStats ? fullData.usageStats.data_points : [],
      days
    );
    if (!dataPoints.length) {
      canvas.parentNode.querySelector(".chart-empty").hidden = false;
      canvas.hidden = true;
      return;
    }
    canvas.parentNode.querySelector(".chart-empty").hidden = true;
    canvas.hidden = false;

    var periodMap = new Map();
    var models = new Set();
    for (var i = 0; i < dataPoints.length; i++) {
      var dp = dataPoints[i];
      var dk = dayKey(dp.period);
      models.add(dp.model_identifier);
      if (!periodMap.has(dk)) periodMap.set(dk, new Map());
      var existing = periodMap.get(dk).get(dp.model_identifier) || 0;
      periodMap.get(dk).set(dp.model_identifier, existing + dp.total_requests);
    }

    var sortedDays = Array.from(periodMap.keys()).sort();
    var modelList = Array.from(models);

    var theme = readThemeColors();
    var datasets = modelList.map(function (model, idx) {
      var color = theme.modelColors[idx % theme.modelColors.length];
      return {
        label: model,
        data: sortedDays.map(function (d) {
          return periodMap.get(d).get(model) || 0;
        }),
        backgroundColor: color,
        hoverBackgroundColor: lightenColor(color, 0.35),
      };
    });

    charts.usageByModel = new Chart(canvas, {
      type: "bar",
      data: { labels: sortedDays, datasets: datasets },
      options: {
        responsive: true,
        animation: false,
        interaction: { mode: "index", intersect: false },
        categoryPercentage: 1,
        barPercentage: 0.92,
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
        },
        scales: {
          x: xScaleOptions(theme, sortedDays, { stacked: true }),
          y: Object.assign(
            { stacked: true, beginAtZero: true },
            baseScaleOptions(theme)
          ),
        },
      },
    });

    attachCustomLegend(canvas, function () { return charts.usageByModel; });
  }

  // --- Requests by Status ---

  function renderRequestStatusChart() {
    if (charts.requestStatus) charts.requestStatus.destroy();
    var canvas = document.getElementById("request-status-chart");
    if (!canvas || !fullData) return;

    var days = daysFromToggle("request-status");
    var dataPoints = filterByPeriod(
      fullData.usageStats ? fullData.usageStats.data_points : [],
      days
    );
    if (!dataPoints.length) {
      canvas.parentNode.querySelector(".chart-empty").hidden = false;
      canvas.hidden = true;
      return;
    }
    canvas.parentNode.querySelector(".chart-empty").hidden = true;
    canvas.hidden = false;

    var periodMap = new Map();
    for (var i = 0; i < dataPoints.length; i++) {
      var dp = dataPoints[i];
      var dk = dayKey(dp.period);
      if (!periodMap.has(dk))
        periodMap.set(dk, {
          success: 0,
          clientError: 0,
          serverError: 0,
          processing: 0,
        });
      var entry = periodMap.get(dk);
      entry.success += dp.success_requests;
      entry.clientError += dp.client_error_requests;
      entry.serverError += dp.server_error_requests;
      entry.processing += dp.processing_requests;
    }

    var sortedDays = Array.from(periodMap.keys()).sort();

    var theme = readThemeColors();
    charts.requestStatus = new Chart(canvas, {
      type: "bar",
      data: {
        labels: sortedDays,
        datasets: [
          {
            label: "Success",
            data: sortedDays.map(function (d) { return periodMap.get(d).success; }),
            backgroundColor: theme.statusSuccess,
            hoverBackgroundColor: lightenColor(theme.statusSuccess, 0.35),
          },
          {
            label: "Server Error",
            data: sortedDays.map(function (d) { return periodMap.get(d).serverError; }),
            backgroundColor: theme.statusServerError,
            hoverBackgroundColor: lightenColor(theme.statusServerError, 0.35),
          },
          {
            label: "Client Error",
            data: sortedDays.map(function (d) { return periodMap.get(d).clientError; }),
            backgroundColor: theme.statusClientError,
            hoverBackgroundColor: lightenColor(theme.statusClientError, 0.35),
          },
          {
            label: "Processing",
            data: sortedDays.map(function (d) { return periodMap.get(d).processing; }),
            backgroundColor: theme.statusProcessing,
            hoverBackgroundColor: lightenColor(theme.statusProcessing, 0.35),
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        interaction: { mode: "index", intersect: false },
        categoryPercentage: 1,
        barPercentage: 0.92,
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
        },
        scales: {
          x: xScaleOptions(theme, sortedDays, { stacked: true }),
          y: Object.assign(
            { stacked: true, beginAtZero: true },
            baseScaleOptions(theme)
          ),
        },
      },
    });

    attachCustomLegend(canvas, function () { return charts.requestStatus; });
  }

  // --- Toggle wiring ---

  var renderMap = {
    "credit-balance": renderCreditBalanceChart,
    "usage-by-model": renderUsageByModelChart,
    "request-status": renderRequestStatusChart,
  };

  function wireToggles() {
    var toggles = document.querySelectorAll(".m__segmented-control");
    for (var i = 0; i < toggles.length; i++) {
      (function (toggle) {
        var chartName = toggle.getAttribute("data-chart");
        var render = renderMap[chartName];
        if (!render) return;
        toggle.addEventListener("change", function () {
          render();
        });
      })(toggles[i]);
    }
  }

  // --- Init ---

  function renderAll() {
    if (!fullData) return;
    renderCreditBalanceChart();
    renderUsageByModelChart();
    renderRequestStatusChart();
  }

  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === "class") {
        renderAll();
        return;
      }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  fetch("/dashboard-charts.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      fullData = data;
      renderAll();
      wireToggles();
    })
    .catch(function (err) {
      console.error("Failed to load dashboard chart data:", err);
    });
})();
