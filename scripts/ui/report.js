const fs = require('node:fs');
const path = require('node:path');
const { buildData } = require('./data');
const { checkStatus } = require('./model');
const { buildReview, checkId } = require('../../src/assets/service/ui-review');
const { isPublicCapture, publicChecks } = require('./public-captures');
const root = path.resolve(__dirname, '../..');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const labels = { match: 'No differences detected', differences: 'Review differences', blocked: 'Unavailable', error: 'Capture failed', stale: 'Recheck needed', 'not-checked': 'Not checked', 'prototype-only': 'Production not captured', 'production-only': '—' };
function exportReport({ data, report, latestDir, output }) {
  // Each export is a portable snapshot. Refuse to overwrite an unrelated folder.
  if (fs.existsSync(output) && fs.readdirSync(output).length) throw new Error('Report folder is not empty. Choose a new --output directory.');
  fs.mkdirSync(output, { recursive: true });
  const checks = publicChecks(report.checks || [], latestDir);
  const routes = data.routes;
  const exported = new Set();
  const image = src => {
    if (typeof src !== 'string' || !/^\/ui-audit\/[a-z0-9][a-z0-9._-]*\.(?:png|webp)$/i.test(src)) return '';
    const name = path.basename(src), source = path.join(latestDir, name);
    if (!fs.existsSync(source) || !isPublicCapture(latestDir, name)) return '';
    const actual = fs.realpathSync(source), base = fs.realpathSync(latestDir);
    if (!actual.startsWith(base + path.sep)) return '';
    fs.mkdirSync(path.join(output, 'images'), { recursive: true });
    if (!exported.has(name)) fs.copyFileSync(source, path.join(output, 'images', name));
    exported.add(name); return `images/${name}`;
  };
  const review = buildReview(checks.filter(check => image(check.screenshots?.prototype) && image(check.screenshots?.production)), routes);
  const notes = item => item ? `<div class="differences">
    ${!item.reviewed && item.elements.length ? '<p class="meta">Detected elements — confirm against the screenshots.</p>' : ''}
    <ul>${item.elements.map(finding => `<li>${finding.element ? `<strong>${escape(finding.element)}</strong> — ` : ''}${escape(finding.difference)}</li>`).join('')}</ul>
    ${item.shared.length ? `<p>Shared styles: ${item.shared.map(group => `<a href="#${escape(group.id)}">${escape(group.title)}</a>`).join(', ')}</p>` : ''}
    ${item.notes.length ? `<details><summary>Data and access</summary>${item.notes.map(note => `<p>${escape(note)}</p>`).join('')}</details>` : ''}
  </div>` : '';
  const screenshots = (value, title, item) => `<div class="screenshots">${Object.entries({ prototype: 'Prototype', production: 'Production' }).map(([key, label]) => {
    const src = image(value?.[key]);
    const diff = key === 'production' ? image(value?.diff) : '';
    return `<figure><figcaption>${label}</figcaption>${src ? `<a href="${escape(src)}"><img src="${escape(src)}" alt="${escape(`${label}: ${title}`)}" loading="lazy"></a>` : '<p>—</p>'}${key === 'production' && src ? notes(item) : ''}${diff ? `<p><a href="${escape(diff)}">Pixel differences</a></p>` : ''}</figure>`;
  }).join('')}</div>`;
  const recommendations = review.shared.length ? `<section class="recommendations" id="general-issues"><h2>Issues</h2>
    <table class="issues-table"><thead><tr><th scope="col">Element</th><th scope="col">Prototype</th><th scope="col">Production</th></tr></thead><tbody>
    ${review.shared.map(group => `<tr id="${escape(group.id)}"><th scope="row">${escape(group.title)}</th>
      <td><code>${escape(group.property)}: ${escape(group.prototype)}</code></td>
      <td><code>${escape(group.property)}: ${escape(group.production)}</code>
      <p class="recommendation-fix"><strong>Recommendation:</strong> ${escape(group.recommendation)}</p>
      <details><summary>Found in ${group.affected.length} places</summary><ul>${group.affected.map(item => `<li><a href="#${escape(item.anchor)}">${escape(item.title)}${item.scenario !== 'default' ? ` · ${escape(item.scenario)}` : ''}</a> — ${escape(item.elements.join(', '))}</li>`).join('')}</ul></details></td>
    </tr>`).join('')}</tbody></table></section>` : '';
  let current = 0;
  const pages = routes.map(route => {
    const pageChecks = checks.filter(check => check.pageId === route.id);
    const states = pageChecks.map(check => checkStatus(check, route.fingerprint));
    const status = !states.length ? 'not-checked' : ['stale', 'blocked', 'error', 'prototype-only', 'production-only', 'differences'].find(value => states.includes(value)) || 'match';
    if (['match', 'differences'].includes(status)) current++;
    const details = pageChecks.map(check => `<section class="state" id="${escape(checkId(check))}">
      <h3>${escape(check.scenario)} <span class="status">${escape(labels[checkStatus(check, route.fingerprint)])}</span></h3>
      <p class="meta">${escape(`${check.viewport?.width || '?'} × ${check.viewport?.height || '?'} · ${check.theme || 'Theme not recorded'} · ${check.role || 'Role not specified'}`)}</p>
      ${check.urls ? `<p class="meta">Production: <a href="${escape(check.urls.production)}">${escape(check.urls.production)}</a><br>Prototype: ${escape(check.urls.prototype)}</p>` : ''}
      ${check.fingerprint !== route.fingerprint ? '<p>The prototype or capture settings changed after this check. Capture this state again.</p>' : ''}
      ${check.error ? `<p>${escape(check.error)}</p>` : ''}
      ${screenshots(check.screenshots, `${route.title}, ${check.scenario}`, review.byCheck.get(check))}
      ${(check.regions || []).map(region => `<details><summary>Region: ${escape(region.id)} · ${(region.ratio * 100).toFixed(2)}% of pixels differ</summary>${screenshots(region.screenshots, region.id)}</details>`).join('')}
    </section>`).join('');
    return `<article id="${escape(route.id)}"><h2>${escape(route.title)} <span class="status">${escape(labels[status])}</span></h2>${details || '<p class="meta">No production capture is available for this page.</p>'}</article>`;
  }).join('');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>UI Scheme · Production comparison</title>
<style>
:root{color-scheme:light;font:16px/1.5 system-ui,sans-serif;color:#2d2c3d;background:#fff}*{box-sizing:border-box}body{max-width:1440px;margin:auto;padding:32px}h1{font-size:32px;letter-spacing:-.03em}h2{font-size:24px}h3{font-size:18px}a,summary{color:#46426e}nav{display:flex;gap:8px 20px;flex-wrap:wrap;margin:24px 0}nav a{font-size:14px}article{border-top:1px solid #d9d8e0;padding:24px 0}h2,h3{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline}.status,.meta{font-size:14px;font-weight:400;color:#626073}.state{padding:8px 0 24px}.meta{overflow-wrap:anywhere}li{margin:8px 0}summary{cursor:pointer;margin:16px 0}.screenshots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;min-width:0}figcaption{font-size:14px;margin:8px 0}img{width:100%;height:auto;border:1px solid #d9d8e0}footer{font-size:14px;margin-top:32px;color:#626073}@media(max-width:700px){body{padding:20px}.screenshots{grid-template-columns:1fr}}@media print{nav{display:none}article{break-inside:avoid}body{padding:0}}
.recommendations{margin:0 0 48px;scroll-margin-top:24px}.issues-table{width:100%;table-layout:fixed;border-collapse:collapse}.issues-table th,.issues-table td{text-align:left;vertical-align:top;padding:16px;border-bottom:1px solid #d9d8e0;overflow-wrap:anywhere}.issues-table th:first-child{width:24%}.issues-table thead th:nth-child(2){width:28%}.issues-table tr{scroll-margin-top:24px}.style-values{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.recommendation-fix{padding:16px;background:#f2f2f6;border-radius:8px}.differences{margin-top:16px}article,.state{scroll-margin-top:24px}
</style></head><body><header><h1>UI Scheme · Production comparison</h1>
<p>Automated findings are candidates for review. Compare the same organization, role and data before assigning a development task. The scenarios below define capture coverage.</p>
<nav aria-label="Report pages">${routes.map(route => `<a href="#${escape(route.id)}">${escape(route.title)}</a>`).join('')}</nav></header>
<main>${recommendations}<h2>Pages</h2>${pages}</main><footer>Open the images to inspect them at full size. This folder contains the report and its comparison images.</footer></body></html>`;
  const filename = path.join(output, 'index.html'); fs.writeFileSync(filename, html);
  return { filename, images: exported.size, current, total: routes.length };
}
if (require.main === module) {
  try {
    const args = Object.fromEntries(process.argv.slice(2).map(arg => { const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=')]; }));
    const artifactRoot = path.resolve(root, args.input || '.ui-audit');
    const latestDir = path.join(artifactRoot, 'latest');
    const resultsFile = path.join(latestDir, 'results.json');
    if (!fs.existsSync(resultsFile)) throw new Error('No audit results found. Run npm run ui:audit first.');
    const output = path.resolve(root, args.output || path.join('.ui-audit/reports', `report-${require('node:crypto').randomUUID().slice(0, 8)}`));
    const result = exportReport({ data: buildData(root), report: JSON.parse(fs.readFileSync(resultsFile, 'utf8')), latestDir, output });
    console.log(`Report: ${result.filename}\n${result.current}/${result.total} page groups captured · ${result.images} images. Share the entire report folder.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { exportReport };
