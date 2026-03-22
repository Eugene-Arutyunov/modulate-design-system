(function () {
  "use strict";

  function formatChartLabel(isoString) {
    var d = new Date(isoString);
    return d.getMonth() + 1 + "/" + d.getDate();
  }

  function cssVar(style, name) {
    return style.getPropertyValue(name).trim();
  }

  function rgbToRgba(rgbStr, alpha) {
    var match = rgbStr.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return rgbStr;
    return "rgba(" + match[1] + ", " + match[2] + ", " + match[3] + ", " + alpha + ")";
  }

  function readThemeColors() {
    var style = getComputedStyle(document.body);
    var textColor = cssVar(style, "--m__text-color") || "#666";
    return {
      text: cssVar(style, "--m__text-caption-color") || "#999",
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

  function renderCreditBalanceChart(creditHistory) {
    var canvas = document.getElementById("credit-balance-chart");
    if (!canvas) return;
    if (
      !creditHistory ||
      !creditHistory.data_points ||
      !creditHistory.data_points.length
    ) {
      canvas.parentNode.querySelector(".chart-empty").hidden = false;
      canvas.hidden = true;
      return;
    }

    var sorted = creditHistory.data_points.slice().sort(function (a, b) {
      return a.period < b.period ? -1 : a.period > b.period ? 1 : 0;
    });

    var labels = [];
    var values = [];
    var running = creditHistory.starting_balance;
    for (var i = 0; i < sorted.length; i++) {
      running += sorted[i].net_delta;
      labels.push(formatChartLabel(sorted[i].period));
      values.push(+(running / 1000).toFixed(2));
    }

    var theme = readThemeColors();
    var baseRgb = theme.chartDefault || "rgb(20, 20, 50)";

    new Chart(canvas, {
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
                0, area.top, 0, area.bottom
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
        plugins: {
          tooltip: { enabled: false },
          legend: {
            position: "bottom",
            labels: {
              color: theme.text,
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 8,
              boxHeight: 8,
              generateLabels: function (chart) {
                var list =
                  Chart.defaults.plugins.legend.labels.generateLabels(chart);
                list[0].fillStyle = rgbToRgba(baseRgb, 0.35);
                return list;
              },
            },
          },
        },
        scales: {
          x: baseScaleOptions(theme),
          y: Object.assign({ grace: "25%" }, baseScaleOptions(theme)),
        },
      },
    });
  }

  function renderUsageByModelChart(dataPoints) {
    var canvas = document.getElementById("usage-by-model-chart");
    if (!canvas) return;
    if (!dataPoints || !dataPoints.length) {
      canvas.parentNode.querySelector(".chart-empty").hidden = false;
      canvas.hidden = true;
      return;
    }

    var periodMap = new Map();
    var models = new Set();
    for (var i = 0; i < dataPoints.length; i++) {
      var dp = dataPoints[i];
      models.add(dp.model_identifier);
      if (!periodMap.has(dp.period)) periodMap.set(dp.period, new Map());
      var existing = periodMap.get(dp.period).get(dp.model_identifier) || 0;
      periodMap.get(dp.period).set(dp.model_identifier, existing + dp.total_requests);
    }

    var sortedPeriods = Array.from(periodMap.keys()).sort();
    var labels = sortedPeriods.map(formatChartLabel);
    var modelList = Array.from(models);

    var theme = readThemeColors();
    var datasets = modelList.map(function (model, idx) {
      return {
        label: model,
        data: sortedPeriods.map(function (p) {
          return periodMap.get(p).get(model) || 0;
        }),
        backgroundColor: theme.modelColors[idx % theme.modelColors.length],
      };
    });

    new Chart(canvas, {
      type: "bar",
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
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

  function renderRequestStatusChart(dataPoints) {
    var canvas = document.getElementById("request-status-chart");
    if (!canvas) return;
    if (!dataPoints || !dataPoints.length) {
      canvas.parentNode.querySelector(".chart-empty").hidden = false;
      canvas.hidden = true;
      return;
    }

    var periodMap = new Map();
    for (var i = 0; i < dataPoints.length; i++) {
      var dp = dataPoints[i];
      if (!periodMap.has(dp.period))
        periodMap.set(dp.period, {
          success: 0,
          clientError: 0,
          serverError: 0,
          processing: 0,
        });
      var entry = periodMap.get(dp.period);
      entry.success += dp.success_requests;
      entry.clientError += dp.client_error_requests;
      entry.serverError += dp.server_error_requests;
      entry.processing += dp.processing_requests;
    }

    var sortedPeriods = Array.from(periodMap.keys()).sort();
    var labels = sortedPeriods.map(formatChartLabel);

    var theme = readThemeColors();
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Success",
            data: sortedPeriods.map(function (p) {
              return periodMap.get(p).success;
            }),
            backgroundColor: theme.statusSuccess,
          },
          {
            label: "Server Error",
            data: sortedPeriods.map(function (p) {
              return periodMap.get(p).serverError;
            }),
            backgroundColor: theme.statusServerError,
          },
          {
            label: "Client Error",
            data: sortedPeriods.map(function (p) {
              return periodMap.get(p).clientError;
            }),
            backgroundColor: theme.statusClientError,
          },
          {
            label: "Processing",
            data: sortedPeriods.map(function (p) {
              return periodMap.get(p).processing;
            }),
            backgroundColor: theme.statusProcessing,
          },
        ],
      },
      options: {
        responsive: true,
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

  fetch("/dashboard-charts-7d.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var usagePoints =
        data.usageStats && data.usageStats.data_points
          ? data.usageStats.data_points
          : [];
      var creditHistory = data.creditHistory || null;

      renderCreditBalanceChart(creditHistory);
      renderUsageByModelChart(usagePoints);
      renderRequestStatusChart(usagePoints);
    })
    .catch(function (err) {
      console.error("Failed to load dashboard chart data:", err);
    });
})();
