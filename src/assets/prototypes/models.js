/**
 * Pricing page client logic.
 * Loads model list and renders pricing cards from the public models API.
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCost(n) {
  if (n < 0.001) return n.toFixed(5);
  if (n < 0.01) return n.toFixed(4);
  return n.toFixed(2);
}

function statusColor(status) {
  if (status === "released") return "var(--m__ui-success-color)";
  if (status === "preview") return "rgb(255, 160, 30)";
  return "";
}

async function loadPricing() {
  const container = document.getElementById("pricing-model-list");
  try {
    const resp = await fetch("/assets/prototypes/data/models.json");
    if (!resp.ok) throw new Error("Failed");
    const { models } = await resp.json();
    renderPricing(models, container);
  } catch {
    container.innerHTML =
      '<p class="docs-loading">Failed to load pricing information.</p>';
  }
}

function renderPricing(models, container) {
  container.innerHTML = "";
  for (const m of models) {
    container.appendChild(createPricingCard(m));
  }
}

function createPricingCard(m) {
  const cost =
    m.cost_dollars_per_thousand_hours === 0
      ? "Free"
      : `$${formatCost(m.cost_dollars_per_thousand_hours / 1000)} per hour`;
  const featureRows = m.feature_costs
    .map(
      (fc) =>
        `<tr><th>${escapeHtml(fc.feature_name)}</th><td>$${formatCost(fc.cost_dollars_per_thousand_hours / 1000)} / hr</td></tr>`,
    )
    .join("");
  const formats =
    m.accepted_media_formats.length > 0
      ? m.accepted_media_formats
          .map((f) => `<code>${escapeHtml(f)}</code>`)
          .join(" ")
      : "—";
  const card = document.createElement("div");
  card.className = "pricing-card m__widget";
  card.innerHTML = `
    <div class="pricing-card__header">
      <h2 class="pricing-card__name">${escapeHtml(m.model_display_label)}</h2>
      <span class="m__tag-flat" style="color: ${statusColor(m.status)}">${escapeHtml(m.status)}</span>
    </div>
    <p class="pricing-card__description">${escapeHtml(m.description)}</p>
    <table class="docs-overview-table">
      <tbody>
        <tr><th>Base cost</th><td>${cost}</td></tr>
        ${featureRows}
        <tr><th>Concurrency quota</th><td>${m.concurrency_quota.toLocaleString()} concurrent requests</td></tr>
        <tr><th>Monthly quota</th><td>${m.usage_quota.toLocaleString()} hours</td></tr>
        <tr><th>Accepted formats</th><td>${formats}</td></tr>
      </tbody>
    </table>`;
  return card;
}

loadPricing();
