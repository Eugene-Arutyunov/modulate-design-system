(function () {
  "use strict";

  var charts = { line: null, bar: null };
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

  function renderLineChart() {
    if (charts.line) charts.line.destroy();
    var canvas = document.getElementById("ds-sample-line-chart");
    if (!canvas || !fullData) return;

    var history = fullData.creditHistory;
    if (!history || !history.data_points || !history.data_points.length) return;

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

    charts.line = new Chart(canvas, {
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
      function () { return charts.line; },
      formatCreditStatusBar
    );
  }

  function renderBarChart() {
    if (charts.bar) charts.bar.destroy();
    var canvas = document.getElementById("ds-sample-bar-chart");
    if (!canvas || !fullData) return;

    var dataPoints =
      fullData.usageStats && fullData.usageStats.data_points
        ? fullData.usageStats.data_points
        : [];
    if (!dataPoints.length) return;

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

    charts.bar = new Chart(canvas, {
      type: "bar",
      data: {
        labels: sortedDays,
        datasets: [
          {
            label: "Success",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).success;
            }),
            backgroundColor: theme.statusSuccess,
            hoverBackgroundColor: lightenColor(theme.statusSuccess, 0.35),
          },
          {
            label: "Server Error",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).serverError;
            }),
            backgroundColor: theme.statusServerError,
            hoverBackgroundColor: lightenColor(theme.statusServerError, 0.35),
          },
          {
            label: "Client Error",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).clientError;
            }),
            backgroundColor: theme.statusClientError,
            hoverBackgroundColor: lightenColor(theme.statusClientError, 0.35),
          },
          {
            label: "Processing",
            data: sortedDays.map(function (d) {
              return periodMap.get(d).processing;
            }),
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

    attachCustomLegend(canvas, function () { return charts.bar; });
  }

  function renderAll() {
    if (!fullData) return;
    renderLineChart();
    renderBarChart();
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
    })
    .catch(function (err) {
      console.error("Failed to load chart data:", err);
    });
})();
