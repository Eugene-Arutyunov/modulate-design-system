// One command to bring Compare screenshots up to date:
//   npm run ui:refresh                       stale rows only (changed prototype, old production)
//   npm run ui:refresh -- --only=dashboard-usage,dashboard-billing
//   npm run ui:refresh -- --all --side=prototype
//   npm run ui:refresh -- --dry-run          show what would be captured
// Captures are anonymized in the page before the screenshot and saved as private candidates
// in .ui-audit/private/runs/<stamp>/. A review page opens at the end; approved images are
// published to ui-public/ from there (or with `npm run ui:publish`).
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const { buildData } = require('./data');
const { paths } = require('./model');
const { scenarios } = require('./audit');
const { replaceFields } = require('./semantic-capture');
const { writeImage } = require('./images');
const { PRODUCTION, ensureSession, readStoplist } = require('./session');
const anonymize = require('./anonymize');

const root = path.resolve(__dirname, '../..');
const RUNS = path.join(root, '.ui-audit/private/runs');
const VIEWPORT = { width: 1440, height: 1000 };
const DAY = 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  return Object.fromEntries(argv.map(arg => { const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true]; }));
}
function loadProductionJobs() {
  return yaml.load(fs.readFileSync(path.join(__dirname, 'production.yaml'), 'utf8')) || {};
}
function readPublished() {
  const file = path.join(root, 'ui-public/results.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { version: 1, checks: [] };
}

/** Which row sides need a new capture. Pure, so it can be tested. */
function planCaptures({ routes, checks, jobs, only, all = false, side, maxAgeDays = 30, now = Date.now() }) {
  const plan = [];
  const pick = id => !only || only.includes(id);
  const checkFor = (id, scenario) => checks.find(c => c.pageId === id && c.scenario === scenario);
  for (const route of routes) {
    if (!pick(route.id)) continue;
    if (side !== 'production' && route.available) {
      for (const scenario of scenarios(route)) {
        const check = checkFor(route.id, scenario.name);
        const reason = !check?.screenshots?.prototype ? 'no prototype image' : check.fingerprint !== route.fingerprint ? 'prototype changed' : all || only ? 'requested' : null;
        if (reason) plan.push({ id: route.id, ids: [route.id], title: route.title, scenario: scenario.name, side: 'prototype', reason, fingerprint: route.fingerprint });
      }
    }
    const job = jobs[route.id];
    if (side !== 'prototype' && job && !job.same_as) {
      const check = checkFor(route.id, 'default');
      const captured = check?.captured?.production ? Date.parse(check.captured.production) : 0;
      const reason = !check?.screenshots?.production ? 'no production image' : !captured ? 'capture date unknown' : now - captured > maxAgeDays * DAY ? `older than ${maxAgeDays} days` : all || only ? 'requested' : null;
      const sharing = Object.entries(jobs).filter(([, j]) => j.same_as === route.id).map(([id]) => id);
      if (reason) plan.push({ id: route.id, ids: [route.id, ...sharing], title: route.title, scenario: 'default', side: 'production', reason });
    }
  }
  return plan;
}

const find = (page, s) => typeof s === 'string' ? page.locator(s) : page.getByRole(s.role, { name: s.name, exact: s.exact !== false });

async function waitStable(page, ms = 12000) {
  const deadline = Date.now() + ms; let previous;
  while (Date.now() < deadline) {
    const image = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css' });
    if (previous && image.equals(previous)) return;
    previous = image; await page.waitForTimeout(250);
  }
  throw new Error('Page did not reach a stable visual state');
}

/** Replaces fields in the page, takes the screenshot, restores the page. No image edits. */
async function shoot(page, rules, { scope, dots }, file) {
  const handle = await page.evaluateHandle(replaceFields, rules);
  const dotEdits = dots ? await page.evaluateHandle(anonymize.rederiveUuidDots) : null;
  try {
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    if (!await handle.evaluate(edits => edits.every(e => e.target.isConnected && e.target[e.property] === e.replacement))) throw new Error('Page rerendered during replacement; capture cancelled');
    if (dotEdits && !await dotEdits.evaluate(edits => edits.every(e => e.s.isConnected && e.s.className === e.next))) throw new Error('UUID dots rerendered during replacement; capture cancelled');
    const options = { animations: 'disabled', caret: 'hide' };
    const image = scope ? await find(page, scope).first().screenshot(options) : await page.screenshot({ ...options, fullPage: true, scale: 'css' });
    await writeImage(image, file);
  } finally {
    if (dotEdits) await dotEdits.evaluate(edits => { for (const e of edits) if (e.s.isConnected && e.s.className === e.next) e.s.className = e.before; });
    await handle.evaluate(edits => { for (const e of edits) if (e.target.isConnected && e.target[e.property] === e.replacement) e.target[e.property] = e.original; });
  }
}

async function capturePrototype(browser, base, route, scenarioName, file) {
  const scenario = scenarios(route).find(s => s.name === scenarioName);
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', reducedMotion: 'reduce' });
  try {
    await context.addInitScript(() => {
      localStorage.setItem('prototype-theme', 'light'); localStorage.setItem('design-system-theme', 'light');
      sessionStorage.setItem('nav-island-open', '0'); localStorage.setItem('prototype-banner-dismissed', '1');
    });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    const state = scenario.prototype || {};
    const response = await page.goto(new URL(state.route || scenario.route || paths(route.target)[0], base).href, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 400) throw new Error(`Prototype returned ${response?.status()}`);
    await page.addStyleTag({ content: '[aria-label="Prototype tools"] { display: none !important; }' });
    await page.locator(state.ready || (await page.locator('main').count() ? 'main' : 'body')).first().waitFor({ state: 'visible' });
    for (const step of state.steps || []) await find(page, step.selector).first()[step.action]();
    if (state.visible) await find(page, state.visible).first().waitFor({ state: 'visible' });
    if (state.waitFor) await page.locator(state.waitFor).waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await waitStable(page);
    const { rules } = await page.evaluate(anonymize.prototypeRules, { substitutions: anonymize.PROTOTYPE_SUBSTITUTIONS, words: anonymize.PROTOTYPE_WORDS, forbidden: anonymize.PROTOTYPE_FORBIDDEN });
    // Component rows publish a crop of the component; pages and dialogs are full-page.
    const scope = route.target?.kind === 'component' ? state.scope : null;
    await shoot(page, rules, { scope }, file);
    return new URL(page.url()).pathname;
  } finally { await context.close(); }
}

async function captureProduction(browser, job, session, stoplist, file) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: job.dpr || 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', reducedMotion: 'reduce', storageState: job.anonymous ? undefined : session });
  try {
    // Read-only: anything other than GET/HEAD/OPTIONS is blocked before it leaves the browser.
    await context.route('**/*', r => ['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.abort('blockedbyclient'));
    await context.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch {} });
    await context.addInitScript(anonymize.recordCanvasText);
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const response = await page.goto(PRODUCTION + job.url, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 400) throw new Error(`Production returned ${response?.status()} for ${job.url}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const ready = await page.locator('main').count() ? 'main' : 'body';
    await page.locator(ready).first().waitFor({ state: 'visible' });
    await page.waitForFunction(sel => { const m = document.querySelector(sel); return m && m.innerText.trim().length > 0 && ![...m.querySelectorAll('.animate-spin,[aria-busy="true"],[role="progressbar"]')].some(e => e.getClientRects().length); }, ready);
    if (!job.anonymous && /\/(signin|login)/.test(new URL(page.url()).pathname)) throw new Error('Signed out — run `npm run ui:login`');
    for (const step of job.steps || []) { await find(page, step.selector).first()[step.action](); await page.waitForLoadState('networkidle').catch(() => {}); }
    if (job.visible) await find(page, job.visible).first().waitFor({ state: 'visible' });
    if (job.ready) await page.waitForFunction(job.ready, null, { timeout: 90000 }).catch(() => { throw new Error('Live data did not load within 90 s'); });
    if (job.min_canvases) await page.waitForFunction(n => document.querySelectorAll('canvas').length >= n, job.min_canvases, { timeout: 60000 }).catch(() => { throw new Error('Charts did not load'); });
    // Never publish a partially loaded page.
    if (await page.getByText(/Failed to load/i).count()) throw new Error('Page shows a load error');
    await page.evaluate(() => document.fonts.ready);
    await waitStable(page);
    const result = await page.evaluate(anonymize.productionRules, { scopeSel: job.scope || null, stoplist });
    anonymize.checkCanvasText(await page.evaluate(() => [...(window.__uiCanvasText || [])]), result);
    await shoot(page, result.rules, { scope: job.scope, dots: true }, file);
    return job.url;
  } finally { await context.close(); }
}

/** Serves a built site folder on a free local port. */
function serveStatic(dir) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
  const server = http.createServer((req, res) => {
    let file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(dir)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

function buildPrototype() {
  const out = path.join(root, '.ui-audit/private/site');
  console.log('Building the prototype site…');
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs'),`--output=${out}`, '--quiet'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, UI_AUDIT_SOURCE: 'public' } });
  if (result.status !== 0) throw new Error('Prototype build failed');
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 8).join('\n')); return; }
  const data = buildData(root);
  const jobs = loadProductionJobs();
  const plan = planCaptures({
    routes: data.routes, checks: readPublished().checks, jobs,
    only: typeof args.only === 'string' ? args.only.split(',') : null, all: Boolean(args.all),
    side: typeof args.side === 'string' ? args.side : null, maxAgeDays: Number(args['max-age']) || 30,
  });
  const unknown = typeof args.only === 'string' ? args.only.split(',').filter(id => !data.routes.some(r => r.id === id)) : [];
  if (unknown.length) throw new Error(`Unknown row IDs: ${unknown.join(', ')}`);
  if (!plan.length) { console.log('Compare is up to date: nothing to capture.'); return; }
  console.log(`${plan.length} capture(s):`);
  for (const item of plan) console.log(`  ${item.side.padEnd(10)} ${item.id}${item.scenario === 'default' ? '' : ` / ${item.scenario}`} (${item.reason})`);
  if (args['dry-run']) return;
  if (fs.existsSync(path.join(root, '.ui-audit/latest/results.json'))) console.warn('Note: .ui-audit/latest/results.json exists and overrides ui-public in the local Compare page. Move it away to see published results.');

  const now = new Date(), pad = n => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const runDir = path.join(RUNS, stamp);
  fs.mkdirSync(runDir, { recursive: true });
  const browser = await chromium.launch();
  let site;
  try {
    let prototypeBase = typeof args.prototype === 'string' ? args.prototype : null;
    if (!prototypeBase && plan.some(i => i.side === 'prototype')) { site = await serveStatic(buildPrototype()); prototypeBase = site.url; }
    let session = null;
    if (plan.some(i => i.side === 'production' && !jobs[i.id].anonymous)) session = await ensureSession(chromium, browser, { interactive: !args['no-login'] });
    const stoplist = readStoplist();
    const routes = new Map(data.routes.map(r => [r.id, r]));
    let next = 0, done = 0;
    const workers = Math.min(6, Math.max(1, Number(args.workers) || 4));
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < plan.length) {
        const item = plan[next++];
        item.file = `${item.id}${item.scenario === 'default' ? '' : `-${item.scenario}`}-${item.side}.webp`;
        const file = path.join(runDir, item.file);
        const started = Date.now();
        try {
          item.path = item.side === 'prototype'
            ? await capturePrototype(browser, prototypeBase, routes.get(item.id), item.scenario, file)
            : await captureProduction(browser, jobs[item.id], session, stoplist, file);
          const { width, height } = await sharp(file).metadata();
          Object.assign(item, { width, height });
        } catch (error) {
          item.error = error.message.split('\n')[0];
          if (fs.existsSync(file)) fs.rmSync(file);
          delete item.file;
        }
        console.log(`[${++done}/${plan.length}] ${item.error ? 'FAILED ' : 'ok     '} ${item.side.padEnd(10)} ${item.id} ${item.error ? `— ${item.error}` : `${item.width}×${item.height}, ${((Date.now() - started) / 1000).toFixed(1)} s`}`);
      }
    }));
  } finally {
    await browser.close();
    site?.server.close();
  }
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ stamp, created: new Date().toISOString(), items: plan }, null, 2) + '\n');
  const failed = plan.filter(i => i.error);
  console.log(`\n${plan.length - failed.length} captured, ${failed.length} failed. Candidates: ${path.relative(root, runDir)}`);
  if (failed.length) process.exitCode = 1;
  if (args['no-review'] || failed.length === plan.length) {
    console.log('Review the images, then publish: npm run ui:publish -- --approve=all');
    return;
  }
  await require('./review').startReview(runDir, { open: !args['no-open'] });
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { planCaptures, RUNS };
