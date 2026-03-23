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

  function formatDayLabels(dayStrings) {
    var prevMonth = -1;
    return dayStrings.map(function (dayStr) {
      var d = new Date(dayStr + "T00:00:00");
      var m = d.getMonth();
      if (m !== prevMonth) {
        prevMonth = m;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return String(d.getDate());
    });
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

  function basePlugins(theme) {
    return {
      tooltip: { enabled: false },
      legend: {
        position: "bottom",
        labels: {
          color: theme.text,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
        },
      },
    };
  }

  function periodCutoff(days) {
    var now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
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
    var labels = formatDayLabels(sortedDays);
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
        labels: labels,
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
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
        },
        scales: {
          x: baseScaleOptions(theme),
          y: Object.assign({ grace: "25%" }, baseScaleOptions(theme)),
        },
      },
    });
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
    var labels = formatDayLabels(sortedDays);
    var modelList = Array.from(models);

    var theme = readThemeColors();
    var datasets = modelList.map(function (model, idx) {
      return {
        label: model,
        data: sortedDays.map(function (d) {
          return periodMap.get(d).get(model) || 0;
        }),
        backgroundColor: theme.modelColors[idx % theme.modelColors.length],
      };
    });

    charts.usageByModel = new Chart(canvas, {
      type: "bar",
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        animation: false,
        categoryPercentage: 1,
        barPercentage: 0.92,
        plugins: basePlugins(theme),
        scales: {
          x: Object.assign({ stacked: true }, baseScaleOptions(theme)),
          y: Object.assign(
            { stacked: true, beginAtZero: true },
            baseScaleOptions(theme)
          ),
        },
      },
    });
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
    var labels = formatDayLabels(sortedDays);

    var theme = readThemeColors();
    charts.requestStatus = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Success",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).success;
            }),
            backgroundColor: theme.statusSuccess,
          },
          {
            label: "Server Error",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).serverError;
            }),
            backgroundColor: theme.statusServerError,
          },
          {
            label: "Client Error",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).clientError;
            }),
            backgroundColor: theme.statusClientError,
          },
          {
            label: "Processing",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).processing;
            }),
            backgroundColor: theme.statusProcessing,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        categoryPercentage: 1,
        barPercentage: 0.92,
        plugins: basePlugins(theme),
        scales: {
          x: Object.assign({ stacked: true }, baseScaleOptions(theme)),
          y: Object.assign(
            { stacked: true, beginAtZero: true },
            baseScaleOptions(theme)
          ),
        },
      },
    });
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
