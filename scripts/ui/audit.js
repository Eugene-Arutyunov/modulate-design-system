const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { PNG } = require('pngjs');
const { buildData } = require('./data');
const { digest, paths } = require('./model');
const root = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map(arg => { const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true]; }));
const artifactRoot = path.resolve(root, typeof args.output === 'string' ? args.output : '.ui-audit');
const latestDir = path.join(artifactRoot, 'latest');
function readJSON(file, fallback) { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback; }
function writeJSON(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2) + '\n'); fs.renameSync(`${file}.tmp`, file); }
function scenarios(route) {
  const configured = route.target?.audit?.scenarios;
  return configured?.length ? configured : paths(route.target).map((url, index) => ({ name: index ? `page-${index + 1}` : 'default', route: url }));
}
function find(page, selector) {
  return typeof selector === 'string' ? page.locator(selector) : page.getByRole(selector.role, { name: selector.name, exact: selector.exact !== false });
}
async function capture(browser, job, side, base, storageState, config, dest) {
  const context = await browser.newContext({ viewport: config.viewport, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: config.theme, reducedMotion: 'reduce', storageState: side === 'production' ? storageState : undefined });
  try {
    // Only read requests run against production. Explicitly listed read-only POST endpoints can be enabled for APIs that need them.
    if (side === 'production') await context.route('**/*', request => {
      const req = request.request(); const allowed = ['GET', 'HEAD', 'OPTIONS'].includes(req.method()) || (req.method() === 'POST' && (config.readOnlyPostPaths || []).includes(new URL(req.url()).pathname));
      return allowed ? request.continue() : request.abort('blockedbyclient');
    });
    await context.addInitScript(({ theme, prototype }) => {
      localStorage.setItem('prototype-theme', theme); localStorage.setItem('design-system-theme', theme);
      sessionStorage.setItem('nav-island-open', '0');
      if (prototype) localStorage.setItem('prototype-banner-dismissed', '1');
    }, { theme: config.theme, prototype: side === 'prototype' });
    const page = await context.newPage(); page.setDefaultTimeout(config.timeout);
    const mapping = config.pages?.[job.route.id] || {};
    const state = { ...(mapping[side] || {}), ...(job.scenario[side] || {}), ...(mapping.scenarios?.[job.scenario.name]?.[side] || {}) };
    const urlPath = state.route || (side === 'production' ? mapping.route || job.route.target?.audit?.production_route : null) || job.scenario.route || paths(job.route.target)[0];
    const url = new URL(urlPath, base).href;
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.timeout });
    if (!response || response.status() >= 400) throw new Error(`Mapped ${side} URL did not load (${response?.status() || 'no response'}): ${url}`);
    if (side === 'prototype') await page.addStyleTag({ content: '[aria-label="Prototype tools"] { display: none !important; }' });
    const needsLogin = async () => {
      if (side !== 'production' || job.route.id.startsWith('auth-')) return false;
      if (/\/(signin|login|auth)(\/|\?|$)/i.test(new URL(page.url()).pathname)) return true;
      if (/^\/(dashboard|internal)(\/|$)/.test(new URL(url).pathname)) for (const role of ['button', 'link']) {
        if (await page.getByRole(role, { name: /^(sign in|log in)$/i }).first().isVisible()) return true;
      }
      return false;
    };
    if (side === 'production' && state.networkIdle !== false) await page.waitForLoadState('networkidle', { timeout: config.timeout });
    const readySelector = state.ready || (side === 'prototype' && !await page.locator('main').count() ? 'body' : 'main');
    try {
      await page.locator(readySelector).first().waitFor({ state: 'visible' });
      await page.waitForFunction(selector => {
        const element = document.querySelector(selector);
        return element && element.innerText?.trim().length > 0 && ![...element.querySelectorAll('[aria-busy="true"], [role="progressbar"], .animate-spin, [data-loading="true"]')].some(item => item.getClientRects().length);
      }, readySelector, { timeout: config.timeout });
    } catch (error) {
      if (await needsLogin()) throw new Error('Sign-in required. No dashboard capture was recorded.');
      throw new Error(`Dashboard content did not become ready: ${error.message}`);
    }
    if (await needsLogin()) throw new Error('Sign-in required. No dashboard capture was recorded.');
    for (const step of (state.steps || mapping.scenarios?.[job.scenario.name]?.[side]?.steps || [])) {
      if (!['click', 'check', 'hover'].includes(step.action)) throw new Error(`Unsupported capture action: ${step.action}`);
      await find(page, step.selector)[step.action]();
    }
    if (state.visible) await find(page, state.visible).waitFor({ state: 'visible' });
    await page.evaluate(async () => { await document.fonts.ready; });
    const readySignal = state.waitFor || mapping[side]?.waitFor;
    if (readySignal) await page.locator(readySignal).waitFor({ state: 'visible' });
    const scope = state.scope ? find(page, state.scope) : page.locator(readySelector).first();
    const mask = (state.mask || mapping[side]?.mask || []).map(selector => page.locator(selector));
    let previousImage, image, stable = false;
    const deadline = Date.now() + config.timeout;
    while (Date.now() < deadline) {
      image = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', mask, scale: 'css' });
      if (previousImage && image.equals(previousImage)) { stable = true; break; }
      previousImage = image;
    }
    if (!stable) throw new Error('Page did not reach a stable visual state. Configure masks or a readiness selector.');
    if (await needsLogin()) throw new Error('Sign-in required. No dashboard capture was recorded.');
    await page.waitForFunction(() => ![...document.querySelectorAll('main .animate-spin, main [aria-busy="true"], main [role="progressbar"]')].some(element => element.getClientRects().length), null, { timeout: config.timeout });
    const structure = await scope.evaluate(element => {
      const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      const text = node => (node.getAttribute('aria-label') || node.labels?.[0]?.textContent || node.textContent || '').trim().replace(/\s+/g, ' ');
      const headings = [...element.querySelectorAll('h1,h2,h3,h4')].filter(visible).map(node => ({ text: text(node), level: node.tagName }));
      const columns = [...element.querySelectorAll('th')].filter(visible).map(text).filter(Boolean);
      const controls = [...element.querySelectorAll('button,input,select,textarea')].filter(visible).map(node => ({ type: node.getAttribute('role') || (node.tagName === 'INPUT' ? node.type : node.tagName.toLowerCase()), label: text(node) })).filter(item => item.label);
      const styles = [...element.querySelectorAll('h1,h2,h3,button,label')].filter(visible).slice(0, 100).map(node => {
        const css = getComputedStyle(node);
        return { key: `${node.tagName}:${text(node)}`, fontSize: css.fontSize, fontWeight: css.fontWeight, borderRadius: css.borderRadius, padding: css.padding };
      }).filter(item => item.key.length < 160);
      return { headings, columns, controls, styles };
    });
    if (!structure.headings.length && !structure.columns.length && !structure.controls.length) throw new Error('No inspectable dashboard content loaded. The shell was not counted as a completed check.');
    fs.writeFileSync(dest, image);
    const regions = {};
    for (const original of (job.route.target?.audit?.regions || [])) {
      const region = { ...original, ...(mapping.regions?.[original.id] || {}) };
      if (region.states && !region.states.includes(job.scenario.name)) continue;
      const selector = region[side]; if (!selector) continue;
      const locator = find(page, selector);
      if (await locator.count() === 1 && await locator.isVisible()) {
        const filename = dest.replace('.png', `-${region.id}.png`);
        await locator.screenshot({ path: filename, animations: 'disabled', caret: 'hide' }); regions[region.id] = filename;
      }
    }
    return { structure, regions, url: page.url() };
  } finally { await context.close(); }
}
function structuralFindings(prototype, production) {
  const findings = [];
  for (const [field, label] of [['headings', 'Headings'], ['columns', 'Table columns'], ['controls', 'Controls']]) {
    const stringify = item => typeof item === 'string' ? item : item.text || `${item.type}: ${item.label}`;
    const a = prototype[field].map(stringify), b = production[field].map(stringify);
    const missing = [...new Set(a.filter(value => !b.includes(value)))], extra = [...new Set(b.filter(value => !a.includes(value)))];
    if (missing.length) findings.push(`${label} only in prototype: ${missing.join('; ')}.`);
    if (extra.length) findings.push(`${label} only in production: ${extra.join('; ')}.`);
    if (!missing.length && !extra.length && JSON.stringify(a) !== JSON.stringify(b)) findings.push(`${label}: order or repeated-item count differs.`);
  }
  const productionStyles = new Map(production.styles.map(item => [item.key, item]));
  for (const target of prototype.styles) {
    const current = productionStyles.get(target.key); if (!current) continue;
    const values = ['fontSize', 'fontWeight', 'borderRadius', 'padding'].filter(key => current[key] !== target[key]);
    if (values.length) findings.push(`${target.key} · ${values.map(key => `${key}: production ${current[key]} → prototype ${target[key]}`).join('; ')}.`);
  }
  return [...new Set(findings)];
}
async function pixelDiff(aPath, bPath, output) {
  const pixelmatch = (await import('pixelmatch')).default;
  const a = PNG.sync.read(fs.readFileSync(aPath)), b = PNG.sync.read(fs.readFileSync(bPath));
  const width = Math.max(a.width, b.width), height = Math.max(a.height, b.height);
  if (width * height > 40_000_000) throw new Error('Screenshot exceeds the 40 megapixel comparison limit. Narrow the capture scope.');
  const paddedA = new PNG({ width, height }), paddedB = new PNG({ width, height }), diff = new PNG({ width, height });
  PNG.bitblt(a, paddedA, 0, 0, a.width, a.height, 0, 0); PNG.bitblt(b, paddedB, 0, 0, b.width, b.height, 0, 0);
  const pixels = pixelmatch(paddedA.data, paddedB.data, diff.data, width, height, { threshold: 0.1 });
  fs.writeFileSync(output, PNG.sync.write(diff));
  return { pixels, ratio: pixels / (width * height), sameDimensions: a.width === b.width && a.height === b.height };
}
async function main() {
  if (args.help) { console.log('npm run ui:audit -- --login --prototype=http://127.0.0.1:8080 --production=https://platform.modulate.ai --only=dashboard-home,dashboard-api-keys --workers=2 --config=.ui-audit/config.json'); return; }
  const configFile = path.resolve(root, typeof args.config === 'string' ? args.config : '.ui-audit/config.json');
  const config = { viewport: { width: 1440, height: 1000 }, theme: 'light', timeout: 20000, ...readJSON(configFile, {}) };
  const base = { prototype: args.prototype || 'http://127.0.0.1:8080', production: args.production || 'https://platform.modulate.ai' };
  for (const value of Object.values(base)) if (!/^https?:$/.test(new URL(value).protocol)) throw new Error('Capture URLs must use HTTP(S).');
  const data = buildData(root);
  const selected = typeof args.only === 'string' ? args.only.split(',') : args.all ? data.routes.filter(route => route.available).map(route => route.id) : ['dashboard-home', 'dashboard-api-keys', 'dashboard-usage', 'dashboard-billing', 'dashboard-organization', 'conversations', 'conversations-review'];
  const routes = data.routes.filter(route => selected.includes(route.id) && route.available);
  if (routes.length !== new Set(selected).size) throw new Error('One or more selected page IDs do not have available prototypes.');
  const jobs = routes.flatMap(route => scenarios(route).map(scenario => ({ route, scenario })));
  const count = Math.min(4, Math.max(1, Number(args.workers) || 2));
  fs.mkdirSync(latestDir, { recursive: true });
  const auth = path.resolve(root, typeof args.auth === 'string' ? args.auth : '.ui-audit/auth.json');
  let storageState = fs.existsSync(auth) ? auth : undefined;
  const browser = await chromium.launch({ headless: !args.login });
  const results = [];
  let contextId;
  try {
    if (args.login) {
      const loginContext = await browser.newContext({ viewport: config.viewport, storageState });
      const loginPage = await loginContext.newPage();
      await loginPage.goto(new URL('/dashboard/overview', base.production).href);
      console.log('Waiting for sign-in in the Modulate browser window. The session stays in memory and is not saved to disk.');
      await loginPage.waitForFunction(() => {
        const visible = element => element.getClientRects().length;
        return location.pathname.startsWith('/dashboard/overview') &&
          [...document.querySelectorAll('a')].some(link => /\/dashboard\/api-keys\/?$/.test(new URL(link.href).pathname) && visible(link)) &&
          ![...document.querySelectorAll('button,a')].some(element => /^(sign in|log in)$/i.test(element.textContent.trim()) && visible(element));
      }, null, { timeout: 900000 });
      storageState = await loginContext.storageState();
      await loginContext.close();
      console.log('Signed in. Starting comparison.');
    }
    contextId = digest({ captureVersion: 2, config, base, session: storageState ? digest(typeof storageState === 'string' ? fs.readFileSync(storageState) : storageState) : null });
    let index = 0;
    await Promise.all(Array.from({ length: count }, async () => {
      while (index < jobs.length) {
        const job = jobs[index++];
        const key = `${job.route.id}-${digest(job.scenario.name).slice(0, 10)}`;
        const dest = suffix => path.join(latestDir, `${key}-${suffix}.png`);
        const result = { key, pageId: job.route.id, title: job.route.title, scenario: job.scenario.name, fingerprint: job.route.fingerprint, viewport: config.viewport, theme: config.theme, role: config.role || '', dataMode: 'Live content; data differences require review', findings: [], status: 'error' };
        try {
          const prototype = await capture(browser, job, 'prototype', base.prototype, undefined, config, dest('prototype'));
          result.screenshots = { prototype: `/ui-audit/${path.basename(dest('prototype'))}` };
          result.urls = { prototype: prototype.url };
          if (args['prototype-only']) result.status = 'prototype-only';
          else {
          let production;
          try { production = await capture(browser, job, 'production', base.production, storageState, config, dest('production')); }
          catch (error) { result.status = 'blocked'; throw error; }
          result.urls = { prototype: prototype.url, production: production.url };
          result.findings = structuralFindings(prototype.structure, production.structure);
          const diff = await pixelDiff(dest('prototype'), dest('production'), dest('diff'));
          result.pixelDiff = diff;
          if (diff.pixels) result.findings.push(`${(diff.ratio * 100).toFixed(2)}% of image pixels differ. Review layout and live data separately.`);
          if (!diff.sameDimensions) result.findings.push('Full-page dimensions differ.');
          result.status = result.findings.length ? 'differences' : 'match';
          result.screenshots = Object.fromEntries(['prototype', 'production', 'diff'].map(side => [side, `/ui-audit/${path.basename(dest(side))}`]));
          result.regions = [];
          for (const id of Object.keys(prototype.regions)) {
            if (!production.regions[id]) continue;
            const regionDiff = await pixelDiff(prototype.regions[id], production.regions[id], dest(`diff-${id}`));
            result.regions.push({ id, ...regionDiff, screenshots: { prototype: `/ui-audit/${path.basename(prototype.regions[id])}`, production: `/ui-audit/${path.basename(production.regions[id])}`, diff: `/ui-audit/${path.basename(dest(`diff-${id}`))}` } });
          }
          }
        } catch (error) { if (result.status !== 'blocked') result.status = 'error'; result.error = error.message; }
        results.push(result); console.log(`${result.pageId} / ${result.scenario}: ${result.status}`);
      }
    }));
  } finally { await browser.close(); }
  results.sort((a, b) => jobs.findIndex(job => job.route.id === a.pageId && job.scenario.name === a.scenario) - jobs.findIndex(job => job.route.id === b.pageId && job.scenario.name === b.scenario));
  const resultsFile = path.join(latestDir, 'results.json');
  const previousReport = readJSON(resultsFile, { checks: [] });
  // Incremental captures replace only selected rows; every row retains its own URLs, viewport and role.
  const previous = previousReport.checks;
  const ids = new Set(results.map(result => result.key));
  const checks = [...previous.filter(check => !ids.has(check.key)), ...results].filter(check => !routes.some(route => route.id === check.pageId) || ids.has(check.key));
  writeJSON(resultsFile, { contextId, checks });
  console.log(`Results: ${resultsFile}\nOpen ${base.prototype}/ui/#mode=compare`);
  if (results.some(result => ['error', 'blocked'].includes(result.status))) process.exitCode = 1;
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { structuralFindings, pixelDiff, scenarios };
