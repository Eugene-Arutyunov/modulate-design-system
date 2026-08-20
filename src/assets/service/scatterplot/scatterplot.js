// Scatterplot renderer ported from modulate-widgets (ScatterPlot only).

// Function to parse cost from string "$0.000930" -> 0.000930
function parseCost(costString) {
  if (typeof costString === 'number') return costString;
  return parseFloat(costString.toString().replace("$", ""));
}

// Function to determine if value should be formatted as currency
function shouldFormatAsCurrency(config) {
  // Check the first data entry
  if (config.data && config.data.length > 0) {
    const firstValue = config.data[0].cost || config.data[0].parametersNumber;
    if (typeof firstValue === 'string' && firstValue.startsWith('$')) {
      return true;
    }
  }
  return false;
}

// Function to format X axis value
function formatAxisXValue(value, config, decimals = 2, showUnit = true) {
  const isCurrency = shouldFormatAsCurrency(config);
  let formattedValue = value.toFixed(decimals);
  if (config.axisX?.trimLabelZeros) {
    formattedValue = String(parseFloat(formattedValue));
  }
  if (isCurrency && showUnit) {
    return "$" + formattedValue;
  }
  return formattedValue;
}

// Function to get number of decimal places with exceptions
function getDecimals(config, axis, vendor = null) {
  const decimalsConfig = config[axis].hoverDecimals;
  if (typeof decimalsConfig === 'object' && decimalsConfig.exceptions) {
    return vendor && decimalsConfig.exceptions[vendor] !== undefined
      ? decimalsConfig.exceptions[vendor]
      : decimalsConfig.default;
  }
  return decimalsConfig;
}

// Function to calculate squared distance between two points
function getDistanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

// Function to check if value is in array considering rounding tolerance
function isValueInLabels(value, labels, epsilon = 0.0001) {
  if (labels.length === 0) return true;
  return labels.some(label => Math.abs(value - label) < epsilon);
}

// Functions for working with point types and vendor classes
const OUTLINED_VENDORS = [
  "OpenAI",
  "Google",
  "Whispeak",
  "Resemble AI",
  "Deep Learning & Media System Laboratory",
  "DF Arena ML Researchers",
  "Momenta",
  "Syntra",
  "Singapore Agency for Science, Technology & Research",
];

const GRAY_BORDER_VENDORS = [
  "Resemble AI",
  "Deep Learning & Media System Laboratory",
  "DF Arena ML Researchers",
  "Momenta",
  "Syntra",
  "Singapore Agency for Science, Technology & Research",
];

const MODULATE_GRADIENT_MODELS = [
  "velma-2-mini",
  "velma-2",
  "velma-1",
  "velma-2-heavy",
];

function getPointType(vendor) {
  return OUTLINED_VENDORS.includes(vendor) ? "outlined" : "filled";
}

function needsGrayBorder(vendor) {
  return GRAY_BORDER_VENDORS.includes(vendor);
}

function needsModulateGradient(vendor, model) {
  return vendor === "Modulate" && MODULATE_GRADIENT_MODELS.includes(model);
}

function normalizeVendorName(vendor) {
  return vendor
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\|\|/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Map vendor names to CSS class names where they differ from normalizeVendorName (e.g. scatterplot-3)
const VENDOR_CSS_CLASS_MAP = {
  "Deep Learning & Media System Laboratory": "vendor-deep-learning-media-system-laboratory",
  "DF Arena ML Researchers": "vendor-df-arena-ml-researchers-no-company",
  "Singapore Agency for Science, Technology & Research": "vendor-singapore-agency-science-technology-research",
};

function getVendorClass(vendor) {
  if (VENDOR_CSS_CLASS_MAP[vendor]) return VENDOR_CSS_CLASS_MAP[vendor];
  return `vendor-${normalizeVendorName(vendor)}`;
}

// Class for creating scatter plot
class ScatterPlot {
  constructor(containerElement, config) {
    this.container = containerElement;
    this.config = config;
    this.pointsData = [];
    this.activePoint = null;
    this.axisScale = null;
    this.hoverRafId = null;
    this.latestMouseEvent = null;
    this.interactionsInitialized = false;
  }

  // Build scale functions and common axis parameters
  buildAxisScale() {
    const config = this.config;

    // Check if axis has a break
    const hasBreak = config.axisX.leftZone && config.axisX.rightZone && config.axisX.break;

    if (hasBreak) {
      const breakPoint = config.axisX.leftZone.max;
      const leftSectionEnd = config.axisX.break.leftSectionEnd;
      const rightSectionStart = config.axisX.break.rightSectionStart;

      return {
        breakPoint,
        leftSectionEnd,
        rightSectionStart,
        hasBreak: true,
        valueToX(value) {
          if (value <= breakPoint) {
            const normalized =
              (value - config.axisX.leftZone.min) /
              (config.axisX.leftZone.max - config.axisX.leftZone.min);
            return normalized * leftSectionEnd;
          }
          const normalized =
            (value - config.axisX.rightZone.min) /
            (config.axisX.rightZone.max - config.axisX.rightZone.min);
          return rightSectionStart + normalized * (100 - rightSectionStart);
        },
        valueToY(value) {
          // For inverted axis: smaller value should be higher (y closer to 0%)
          if (config.axisY.inverted) {
            // Invert: larger score value -> lower on chart
            const normalized = (config.axisY.max - value) / (config.axisY.max - config.axisY.min);
            return (1 - normalized) * 100;
          } else {
            // Normal axis: larger value -> higher on chart
            const normalized = (value - config.axisY.min) / (config.axisY.max - config.axisY.min);
            return (1 - normalized) * 100;
          }
        },
      };
    } else {
      // Without axis break
      return {
        hasBreak: false,
        valueToX(value) {
          const normalized =
            (value - config.axisX.min) / (config.axisX.max - config.axisX.min);
          return normalized * 100;
        },
        valueToY(value) {
          // For inverted axis: smaller value should be higher (y closer to 0%)
          if (config.axisY.inverted) {
            // Invert: larger score value -> lower on chart
            const normalized = (config.axisY.max - value) / (config.axisY.max - config.axisY.min);
            return (1 - normalized) * 100;
          } else {
            // Normal axis: larger value -> higher on chart
            const normalized = (value - config.axisY.min) / (config.axisY.max - config.axisY.min);
            return (1 - normalized) * 100;
          }
        },
      };
    }
  }

  // Build grid lines based on configuration
  createGridLines() {
    const container = this.container;
    const config = this.config;
    const scale = this.axisScale;

    // Grid lines for Y axis
    const yGridConfig = config.axisY.gridLines;
    // Generate all values with step interval for drawing lines
    const yValues = [];
    // Determine number of decimal places for rounding
    const decimals = yGridConfig.step.toString().split('.')[1]?.length || 0;
    for (let val = config.axisY.min + yGridConfig.step; val <= config.axisY.max; val += yGridConfig.step) {
      // Round value to avoid floating point errors
      const roundedVal = Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
      yValues.push(roundedVal);
    }

    // Add values from labels if they didn't fall into the sequence
    if (yGridConfig.labels.length > 0) {
      yGridConfig.labels.forEach(label => {
        if (label >= config.axisY.min && label <= config.axisY.max) {
          // Check if value already exists in yValues (with tolerance)
          const exists = yValues.some(val => Math.abs(val - label) < 0.0001);
          if (!exists) {
            yValues.push(label);
          }
        }
      });
      // Sort values
      yValues.sort((a, b) => a - b);
    }

    // Determine the last value that will be displayed with a label for Y axis
    const yLabelValues = yGridConfig.labels.length > 0
      ? yValues.filter(val => isValueInLabels(val, yGridConfig.labels))
      : yValues.filter(val => val <= config.axisY.max && val >= config.axisY.min);

    const yLastValue = yLabelValues.length > 0 ? yLabelValues[yLabelValues.length - 1] : null;
    const yFirstValue = yLabelValues.length > 0 ? yLabelValues[0] : null;
    // For percentages show only on last, for other units - on first and last
    const unit = config.axisY.unit || "";
    const isPercent = unit.includes("%");
    const showUnitsOnFirstAndLastY = config.axisY.showUnitsOnFirstAndLast !== undefined
      ? config.axisY.showUnitsOnFirstAndLast
      : !isPercent; // Default: percentages - only last, otherwise first and last

    yValues.forEach((score) => {
      if (score <= config.axisY.max && score >= config.axisY.min) {
        const y = scale.valueToY(score);

        // External tick mark
        const tick = document.createElement("div");
        tick.className = "scatterplot-tick-y";
        tick.style.top = `${y}%`;
        container.appendChild(tick);

        // Horizontal grid line
        if (scale.hasBreak) {
          // With break: two parts
          const gridLineLeft = document.createElement("div");
          gridLineLeft.className = "scatterplot-grid-line-y scatterplot-grid-line-y-left";
          gridLineLeft.style.top = `${y}%`;
          container.appendChild(gridLineLeft);

          const gridLineRight = document.createElement("div");
          gridLineRight.className = "scatterplot-grid-line-y scatterplot-grid-line-y-right";
          gridLineRight.style.top = `${y}%`;
          container.appendChild(gridLineRight);
        } else {
          // Without break: single line
          const gridLine = document.createElement("div");
          gridLine.className = "scatterplot-grid-line-y";
          gridLine.style.top = `${y}%`;
          gridLine.style.width = "100%";
          gridLine.style.left = "0";
          container.appendChild(gridLine);
        }

        // Add labels only for values from labels (if specified) or for all (if labels is empty)
        const shouldAddLabel = isValueInLabels(score, yGridConfig.labels);
        if (shouldAddLabel) {
          const scoreLabel = document.createElement("div");
          scoreLabel.className = "scatterplot-static-label scatterplot-static-label-score";
          scoreLabel.style.top = `${y}%`;
          // Format number with correct number of decimal places
          const decimals = config.axisY.staticDecimals !== undefined ? config.axisY.staticDecimals : (yGridConfig.step.toString().split('.')[1]?.length || 0);
          const formattedValue = decimals === 0 ? Math.round(score).toString() : score.toFixed(decimals);
          const unit = config.axisY.unit || "";
          const showUnit = showUnitsOnFirstAndLastY
            ? (score === yFirstValue || score === yLastValue)
            : (score === yLastValue);
          scoreLabel.innerHTML = formattedValue + (showUnit ? unit : "");
          container.appendChild(scoreLabel);
        }
      }
    });

    // Grid lines for X axis
    if (scale.hasBreak) {
      // With break: left and right parts
      const leftConfig = config.axisX.gridLines.left;
      const rightConfig = config.axisX.gridLines.right;

      // Left part
      // Generate all values with step interval for drawing lines
      const leftValues = [];
      for (let val = config.axisX.leftZone.min + leftConfig.step; val <= leftConfig.max; val += leftConfig.step) {
        leftValues.push(val);
      }

      // Add values from labels if they didn't fall into the sequence
      if (leftConfig.labels.length > 0) {
        leftConfig.labels.forEach(label => {
          if (label >= config.axisX.leftZone.min && label <= leftConfig.max) {
            // Check if value already exists in leftValues (with tolerance)
            const exists = leftValues.some(val => Math.abs(val - label) < 0.0001);
            if (!exists) {
              leftValues.push(label);
            }
          }
        });
        // Sort values
        leftValues.sort((a, b) => a - b);
      }

      // Determine the last value that will be displayed with a label
      const leftLabelValues = leftConfig.labels.length > 0
        ? leftValues.filter(val => isValueInLabels(val, leftConfig.labels))
        : leftValues.filter(val => val <= leftConfig.max && val >= config.axisX.leftZone.min);

      const leftLastValue = config.axisX.leftZone.max;
      const leftFirstValue = leftLabelValues.length > 0 ? leftLabelValues[0] : null;
      // For currency show on first and last, otherwise only on last
      const isCurrency = shouldFormatAsCurrency(config);
      const showUnitsOnFirstAndLast = config.axisX.showUnitsOnFirstAndLast !== undefined
        ? config.axisX.showUnitsOnFirstAndLast
        : isCurrency; // Default: currency - first and last, otherwise only last

      // When Y axis doesn't start at 0, render tick+label for x=0 explicitly
      // (the loop starts at leftZone.min + step, so 0 is never included)
      if (config.axisX.leftZone.min === 0 && config.axisY.min !== 0) {
        const x0 = scale.valueToX(0);
        const tick0 = document.createElement("div");
        tick0.className = "scatterplot-tick-x";
        tick0.style.left = `${x0}%`;
        container.appendChild(tick0);

        const label0 = document.createElement("div");
        label0.className = "scatterplot-static-label scatterplot-static-label-cost";
        label0.style.left = `${x0}%`;
        label0.textContent = "0";
        container.appendChild(label0);
      }

      leftValues.forEach((cost) => {
        if (cost <= leftConfig.max && cost >= config.axisX.leftZone.min) {
          const x = scale.valueToX(cost);
          if (x < scale.leftSectionEnd) {
            const tick = document.createElement("div");
            tick.className = "scatterplot-tick-x";
            tick.style.left = `${x}%`;
            container.appendChild(tick);

            const gridLine = document.createElement("div");
            gridLine.className = "scatterplot-grid-line-x scatterplot-grid-line-x-left";
            gridLine.style.left = `${x}%`;
            container.appendChild(gridLine);

            // Add labels only for values from labels (if specified) or for all (if labels is empty)
            const shouldAddLabel = isValueInLabels(cost, leftConfig.labels);
            if (shouldAddLabel) {
              const costLabel = document.createElement("div");
              costLabel.className = "scatterplot-static-label scatterplot-static-label-cost";
              costLabel.style.left = `${x}%`;
              const decimals = config.axisX.staticDecimals !== undefined ? config.axisX.staticDecimals : 2;
              const showUnit = showUnitsOnFirstAndLast
                ? (cost === leftFirstValue || cost === leftLastValue)
                : (cost === leftLastValue);
              costLabel.textContent = formatAxisXValue(cost, config, decimals, showUnit);
              container.appendChild(costLabel);
            }
          }
        }
      });

      // Label for the rightmost value of the first zone
      const leftZoneMaxX = scale.valueToX(config.axisX.leftZone.max);
      const leftZoneMaxLabel = document.createElement("div");
      leftZoneMaxLabel.className = "scatterplot-static-label scatterplot-static-label-cost";
      leftZoneMaxLabel.style.left = `${leftZoneMaxX}%`;
      const decimals = config.axisX.staticDecimals !== undefined ? config.axisX.staticDecimals : 2;
      const showUnitLeftMax = showUnitsOnFirstAndLast
        ? (config.axisX.leftZone.max === leftFirstValue || config.axisX.leftZone.max === leftLastValue)
        : (config.axisX.leftZone.max === leftLastValue);
      leftZoneMaxLabel.textContent = formatAxisXValue(config.axisX.leftZone.max, config, decimals, showUnitLeftMax);
      container.appendChild(leftZoneMaxLabel);

      // Right part
      // Generate all values with step interval from zero (as if lines were from zero)
      const rightValues = [];
      for (let val = rightConfig.step; val <= rightConfig.max; val += rightConfig.step) {
        // Add only values that fall within the right zone range
        if (val >= config.axisX.rightZone.min && val <= rightConfig.max) {
          rightValues.push(val);
        }
      }

      // Add values from labels if they didn't fall into the sequence
      if (rightConfig.labels.length > 0) {
        rightConfig.labels.forEach(label => {
          if (label >= config.axisX.rightZone.min && label <= rightConfig.max) {
            // Check if value already exists in rightValues (with tolerance)
            const exists = rightValues.some(val => Math.abs(val - label) < 0.0001);
            if (!exists) {
              rightValues.push(label);
            }
          }
        });
        // Sort values
        rightValues.sort((a, b) => a - b);
      }

      // Determine the last value that will be displayed with a label for the right part
      const rightLabelValues = rightConfig.labels.length > 0
        ? rightValues.filter(val => isValueInLabels(val, rightConfig.labels))
        : rightValues.filter(val => val <= rightConfig.max && val >= config.axisX.rightZone.min);

      const rightLastValue = rightLabelValues.length > 0 ? rightLabelValues[rightLabelValues.length - 1] : null;
      const rightFirstValue = rightLabelValues.length > 0 ? rightLabelValues[0] : null;

      rightValues.forEach((cost) => {
        if (cost <= rightConfig.max && cost >= config.axisX.rightZone.min) {
          const x = scale.valueToX(cost);
          if (x >= scale.rightSectionStart) {
            const tick = document.createElement("div");
            tick.className = "scatterplot-tick-x";
            tick.style.left = `${x}%`;
            container.appendChild(tick);

            const gridLine = document.createElement("div");
            gridLine.className = "scatterplot-grid-line-x scatterplot-grid-line-x-right";
            gridLine.style.left = `${x}%`;
            container.appendChild(gridLine);

            // Add labels only for values from labels (if specified) or for all (if labels is empty)
            const shouldAddLabel = isValueInLabels(cost, rightConfig.labels);
            if (shouldAddLabel) {
              const costLabel = document.createElement("div");
              costLabel.className = "scatterplot-static-label scatterplot-static-label-cost";
              costLabel.style.left = `${x}%`;
              const decimals = config.axisX.staticDecimals !== undefined ? config.axisX.staticDecimals : 2;
              const showUnit = showUnitsOnFirstAndLast
                ? (cost === rightFirstValue || cost === rightLastValue)
                : (cost === rightLastValue);
              costLabel.textContent = formatAxisXValue(cost, config, decimals, showUnit);
              container.appendChild(costLabel);
            }
          }
        }
      });

      // Calculate actual width of right section
      const maxCostXForWidth = scale.valueToX(config.axisX.rightZone.max);
      const rightSectionActualWidth = maxCostXForWidth - scale.rightSectionStart;
      container.style.setProperty('--right-section-width', `${rightSectionActualWidth}%`);
    } else {
      // Without break: unified settings
      const xGridConfig = config.axisX.gridLines;
      // Generate all values with step interval for drawing lines
      const xValues = [];
      for (let val = config.axisX.min + xGridConfig.step; val <= config.axisX.max; val += xGridConfig.step) {
        xValues.push(val);
      }

      // Add values from labels if they didn't fall into the sequence
      if (xGridConfig.labels.length > 0) {
        xGridConfig.labels.forEach(label => {
          if (label >= config.axisX.min && label <= config.axisX.max) {
            // Check if value already exists in xValues (with tolerance)
            const exists = xValues.some(val => Math.abs(val - label) < 0.0001);
            if (!exists) {
              xValues.push(label);
            }
          }
        });
        // Sort values
        xValues.sort((a, b) => a - b);
      }

      // Determine the last value that will be displayed with a label
      const xLabelValues = xGridConfig.labels.length > 0
        ? xValues.filter(val => isValueInLabels(val, xGridConfig.labels))
        : xValues.filter(val => val <= config.axisX.max && val >= config.axisX.min);

      const xLastValue = xLabelValues.length > 0 ? xLabelValues[xLabelValues.length - 1] : null;
      const xFirstValue = xLabelValues.length > 0 ? xLabelValues[0] : null;
      // For currency show on first and last, otherwise only on last
      const isCurrencyX = shouldFormatAsCurrency(config);
      const showUnitsOnFirstAndLastX = config.axisX.showUnitsOnFirstAndLast !== undefined
        ? config.axisX.showUnitsOnFirstAndLast
        : isCurrencyX; // Default: currency - first and last, otherwise only last

      xValues.forEach((cost) => {
        if (cost <= config.axisX.max && cost >= config.axisX.min) {
          // Skip tick, grid line and label for 0 when both axes start at 0 — the shared static zero is used.
          const skipOrigin = cost === 0 && config.axisX.min === 0 && config.axisY.min === 0;
          if (skipOrigin) return;

          const x = scale.valueToX(cost);

          const tick = document.createElement("div");
          tick.className = "scatterplot-tick-x";
          tick.style.left = `${x}%`;
          container.appendChild(tick);

          const gridLine = document.createElement("div");
          gridLine.className = "scatterplot-grid-line-x";
          gridLine.style.left = `${x}%`;
          container.appendChild(gridLine);

          // Add labels only for values from labels (if specified) or for all (if labels is empty).
          const shouldAddLabel = isValueInLabels(cost, xGridConfig.labels);
          if (shouldAddLabel) {
            const costLabel = document.createElement("div");
            costLabel.className = "scatterplot-static-label scatterplot-static-label-cost";
            costLabel.style.left = `${x}%`;
            const decimals = config.axisX.staticDecimals !== undefined ? config.axisX.staticDecimals : (cost < 1 ? 2 : 0);
            const showUnit = showUnitsOnFirstAndLastX
              ? (cost === xFirstValue || cost === xLastValue)
              : (cost === xLastValue);
            costLabel.textContent = formatAxisXValue(cost, config, decimals, showUnit);
            container.appendChild(costLabel);
          }
        }
      });
    }

    // When Y axis doesn't start at 0, replace border-left with a gradient div
    if (config.axisY.min !== 0) {
      container.classList.add("scatterplot-aria--y-fades");
      const yAxisLine = document.createElement("div");
      yAxisLine.className = "scatterplot-y-axis-line";
      container.appendChild(yAxisLine);
    }

    // Zero (0) on X axis — shared static label at origin, only when Y axis also starts at 0.
    // When axisY.min !== 0, the "0" is instead rendered as a normal X-axis tick+label above.
    if (config.axisY.min === 0) {
      const zeroLabel = document.createElement("div");
      zeroLabel.className = "scatterplot-static-label scatterplot-static-label-zero";
      zeroLabel.textContent = "0";
      container.appendChild(zeroLabel);
    }
  }

  // Find nearest point to cursor
  findNearestPoint(mouseX, mouseY) {
    const rect = this.container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const mouseXPercent = ((mouseX - rect.left) / containerWidth) * 100;
    const mouseYPercent = ((mouseY - rect.top) / containerHeight) * 100;

    let nearestPoint = null;
    let minDistance = Infinity;

    this.pointsData.forEach((pointData) => {
      const distance = getDistanceSquared(
        mouseXPercent,
        mouseYPercent,
        pointData.xPercent,
        pointData.yPercent
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = pointData;
      }
    });

    return nearestPoint;
  }

  // Highlight point
  highlightPoint(pointElement, modelData) {
    const container = this.container;
    if (!container) return;

    const costLabel = container.querySelector(".scatterplot-axis-x-label");
    const scoreLabel = container.querySelector(".scatterplot-axis-y-label");
    const costLabelTick = container.querySelector(".scatterplot-axis-x-tick");
    const scoreLabelTick = container.querySelector(".scatterplot-axis-y-tick");

    // Remove highlight from previous point
    if (this.activePoint && this.activePoint.element) {
      this.activePoint.element.classList.remove("scatterplot-point-active");
      if (this.activePoint.label) {
        this.activePoint.label.classList.remove("scatterplot-point-label-active");
      }
    }

    // Highlight new point and update labels
    if (pointElement && modelData) {
      pointElement.classList.add("scatterplot-point-active");
      const pointData = this.pointsData.find(p => p.element === pointElement);
      if (pointData && pointData.label) {
        pointData.label.classList.add("scatterplot-point-label-active");
      }
      this.activePoint = { element: pointElement, label: pointData?.label, model: modelData };

      const costValue = modelData.cost || modelData.parametersNumber;
      const cost = parseCost(costValue);
      const x = this.axisScale.valueToX(cost);
      const displayScore = this.config.useVisualOffset && modelData.visualOffset !== undefined
        ? modelData.score + modelData.visualOffset
        : modelData.score;
      const y = this.axisScale.valueToY(displayScore);

      // Update cost label and its tick
      if (costLabel) {
        costLabel.style.left = `${x}%`;
        const decimals = getDecimals(this.config, 'axisX', modelData.vendor);
        costLabel.textContent = formatAxisXValue(cost, this.config, decimals);
        costLabel.style.display = "block";
      }
      if (costLabelTick) {
        costLabelTick.style.left = `${x}%`;
        costLabelTick.style.display = "block";
      }

      // Update score label and its tick
      if (scoreLabel) {
        scoreLabel.style.top = `${y}%`;
        const decimals = getDecimals(this.config, 'axisY', modelData.vendor);
        const formattedValue = modelData.score.toFixed(decimals);
        const unit = this.config.axisY.unit || "";
        scoreLabel.innerHTML = formattedValue + (unit ? unit : "");
        scoreLabel.style.display = "block";
      }
      if (scoreLabelTick) {
        scoreLabelTick.style.top = `${y}%`;
        scoreLabelTick.style.display = "block";
      }
    } else {
      // Remove active state from point and label
      if (this.activePoint && this.activePoint.element) {
        this.activePoint.element.classList.remove("scatterplot-point-active");
        if (this.activePoint.label) {
          this.activePoint.label.classList.remove("scatterplot-point-label-active");
        }
      }
      this.activePoint = null;
      // Hide labels and ticks
      if (costLabel) costLabel.style.display = "none";
      if (scoreLabel) scoreLabel.style.display = "none";
      if (costLabelTick) costLabelTick.style.display = "none";
      if (scoreLabelTick) scoreLabelTick.style.display = "none";
    }
  }

  // Initialize interactions
  initInteractions() {
    if (!this.container || this.interactionsInitialized) return;

    const handleMove = (e) => {
      this.latestMouseEvent = e;
      if (this.hoverRafId) return;
      this.hoverRafId = requestAnimationFrame(() => {
        this.hoverRafId = null;
        if (!this.latestMouseEvent || !this.container) return;
        const nearestPointData = this.findNearestPoint(
          this.latestMouseEvent.clientX,
          this.latestMouseEvent.clientY
        );
        if (nearestPointData) {
          this.highlightPoint(nearestPointData.element, nearestPointData.model);
        }
      });
    };

    const handleLeave = () => {
      this.latestMouseEvent = null;
      if (this.hoverRafId) {
        cancelAnimationFrame(this.hoverRafId);
        this.hoverRafId = null;
      }
      this.highlightPoint(null, null);
    };

    this.container.addEventListener("mousemove", handleMove);
    this.container.addEventListener("mouseleave", handleLeave);
    this.interactionsInitialized = true;
  }

  // Create scatter plot
  createScatterPlot() {
    const container = this.container;
    if (!container) {
      console.error("Container not found for creating chart");
      return;
    }

    const config = this.config;
    if (!config || !config.data) {
      console.error("Configuration or data missing:", config);
      return;
    }

    this.axisScale = this.buildAxisScale();
    if (!this.axisScale) {
      console.error("Failed to build axis scale");
      return;
    }

    this.initInteractions();

    // Save axis labels and background highlight before clearing
    const axisLabelX = container.querySelector(".scatterplot-axis-label-x");
    const axisLabelY = container.querySelector(".scatterplot-axis-label-y");
    const backgroundHighlight = container.querySelector(".scatterplot-background-highlight");

    // Clone elements before clearing to preserve their structure
    const axisLabelXClone = axisLabelX ? axisLabelX.cloneNode(true) : null;
    const axisLabelYClone = axisLabelY ? axisLabelY.cloneNode(true) : null;
    const backgroundHighlightClone = backgroundHighlight ? backgroundHighlight.cloneNode(true) : null;

    // Clear container and data
    container.innerHTML = "";
    this.pointsData = [];
    this.activePoint = null;

    // Restore background highlight
    if (backgroundHighlightClone) {
      // Update label text from configuration if specified
      if (config.backgroundHighlight && config.backgroundHighlight.text) {
        const labelElement = backgroundHighlightClone.querySelector(".scatterplot-background-highlight-label");
        if (labelElement) {
          labelElement.textContent = config.backgroundHighlight.text;
        }
      }
      container.appendChild(backgroundHighlightClone);
    }

    // Restore axis labels
    if (axisLabelXClone) {
      container.appendChild(axisLabelXClone);
    }
    if (axisLabelYClone) {
      container.appendChild(axisLabelYClone);
    }

    const scale = this.axisScale;

    // Set CSS variables for X axis line (and horizontal grid when break)
    if (scale.hasBreak) {
      container.style.setProperty('--left-section-end', `${scale.leftSectionEnd}%`);
      container.style.setProperty('--right-section-start', `${scale.rightSectionStart}%`);
    } else {
      container.style.setProperty('--left-section-end', '100%');
      container.style.setProperty('--right-section-width', '0%');
    }

    // Draw points
    if (!config.data || config.data.length === 0) {
      console.warn("No data to display");
      return;
    }

    // Find maximum X axis value to determine rightmost points
    let maxXValue = -Infinity;
    config.data.forEach((model) => {
      const costValue = model.cost || model.parametersNumber;
      const cost = parseCost(costValue);
      if (cost > maxXValue) {
        maxXValue = cost;
      }
    });

    config.data.forEach((model) => {
      const costValue = model.cost || model.parametersNumber;
      const cost = parseCost(costValue);
      const x = scale.valueToX(cost);
      const displayScore = config.useVisualOffset && model.visualOffset !== undefined
        ? model.score + model.visualOffset
        : model.score;
      const y = scale.valueToY(displayScore);

      if (isNaN(x) || isNaN(y)) {
        console.warn("Invalid coordinates for point:", { model, x, y, cost, displayScore });
        return;
      }

      const point = document.createElement("div");
      const vendorClass = getVendorClass(model.vendor);
      const pointType = getPointType(model.vendor);
      point.className = `scatterplot-point ${vendorClass} ${pointType}`;

      if (needsGrayBorder(model.vendor)) {
        point.classList.add("vendor-gray-border");
      }
      if (model.vendor === "Modulate") {
        point.classList.add("vendor-modulate-gradient");
      }

      point.style.left = `${x}%`;
      point.style.top = `${y}%`;
      point.dataset.vendor = model.vendor;
      point.dataset.model = model.model;
      point.dataset.modelType = model.modelType || "";
      point.dataset.score = model.score;
      const isCurrency = shouldFormatAsCurrency(config);
      point.dataset.cost = typeof costValue === 'string' ? costValue : (isCurrency ? "$" + cost.toFixed(2) : cost.toFixed(2));

      // Create model name label
      const modelLabel = document.createElement("div");
      modelLabel.className = "scatterplot-point-label";
      // For gpt-5.2 and gpt-5.2-pro label on left
      if (model.model === "gpt-5.2" || model.model === "gpt-5.2-pro") {
        modelLabel.classList.add("scatterplot-point-label-left");
      }
      // For rightmost points (in last 5% of range) label on left
      const threshold = maxXValue * 0.95;
      if (cost >= threshold) {
        modelLabel.classList.add("scatterplot-point-label-left");
      }
      modelLabel.textContent = model.model;
      modelLabel.dataset.vendor = model.vendor;
      modelLabel.style.left = `${x}%`;
      modelLabel.style.top = `${y}%`;
      container.appendChild(modelLabel);

      // Save point data
      this.pointsData.push({
        element: point,
        label: modelLabel,
        model: model,
        xPercent: x,
        yPercent: y,
      });

      container.appendChild(point);
    });

    // Create grid lines
    this.createGridLines();

    // Create dynamic labels for active point
    const costLabel = document.createElement("div");
    costLabel.className = "scatterplot-axis-x-label";
    costLabel.style.display = "none";
    container.appendChild(costLabel);

    const scoreLabel = document.createElement("div");
    scoreLabel.className = "scatterplot-axis-y-label";
    scoreLabel.style.display = "none";
    container.appendChild(scoreLabel);

    // Create ticks and lines for active point labels
    const costLabelTick = document.createElement("div");
    costLabelTick.className = "scatterplot-axis-x-tick";
    costLabelTick.style.display = "none";
    container.appendChild(costLabelTick);

    const scoreLabelTick = document.createElement("div");
    scoreLabelTick.className = "scatterplot-axis-y-tick";
    scoreLabelTick.style.display = "none";
    container.appendChild(scoreLabelTick);

    // Create visual axis break element (if exists)
    if (scale.hasBreak) {
      const GAP_SIZE = scale.rightSectionStart - scale.leftSectionEnd;

      const axisBreakLeft = document.createElement("div");
      axisBreakLeft.className = "scatterplot-axis-break scatterplot-axis-break-left";
      axisBreakLeft.style.left = `${scale.leftSectionEnd}%`;
      axisBreakLeft.style.width = `${GAP_SIZE}%`;
      container.appendChild(axisBreakLeft);

      const axisBreakRight = document.createElement("div");
      axisBreakRight.className = "scatterplot-axis-break scatterplot-axis-break-right";
      axisBreakRight.style.left = `${scale.rightSectionStart}%`;
      axisBreakRight.style.width = `${GAP_SIZE}%`;
      container.appendChild(axisBreakRight);
    }
  }
}

function createVendorsLegend(containerSelector, config) {
  const vendorsContainer = document.querySelector(containerSelector);
  if (!vendorsContainer || !config || !config.data) return;

  let vendors;
  if (config.legendOrderByCost) {
    // Sort by cost ascending: Modulate first, then others by min cost
    const vendorCosts = new Map();
    config.data.forEach((item) => {
      const costVal = parseCost(item.cost ?? item.costPerHour ?? 0);
      if (!vendorCosts.has(item.vendor) || costVal < vendorCosts.get(item.vendor)) {
        vendorCosts.set(item.vendor, costVal);
      }
    });
    vendors = Array.from(vendorCosts.entries())
      .sort((a, b) => {
        if (a[0] === "Modulate") return -1;
        if (b[0] === "Modulate") return 1;
        return a[1] - b[1];
      })
      .map(([vendor]) => vendor);
  } else {
    // Order of first appearance in data
    vendors = [];
    const vendorsSet = new Set();
    config.data.forEach((item) => {
      if (!vendorsSet.has(item.vendor)) {
        vendorsSet.add(item.vendor);
        vendors.push(item.vendor);
      }
    });
  }

  // Create elements for each vendor
  vendors.forEach((vendor) => {
    const vendorItem = document.createElement("div");
    vendorItem.className = "vendor-item";

    const point = document.createElement("div");
    const vendorClass = getVendorClass(vendor);
    const pointType = getPointType(vendor);
    point.className = `scatterplot-point ${vendorClass} ${pointType}`;

    if (vendor === "Modulate") {
      point.classList.add("vendor-modulate-gradient");
    }

    if (needsGrayBorder(vendor)) {
      point.classList.add("vendor-gray-border");
    }

    const label = document.createElement("span");
    label.className = "vendor-label";
    label.textContent = vendor;

    vendorItem.appendChild(point);
    vendorItem.appendChild(label);
    vendorsContainer.appendChild(vendorItem);
  });
}

export {
  ScatterPlot,
  createVendorsLegend,
  parseCost,
  getVendorClass,
  getPointType,
  needsGrayBorder,
};
