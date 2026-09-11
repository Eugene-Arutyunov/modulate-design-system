const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium, expect } = require('@playwright/test');
const { exportReport } = require('../../scripts/ui/report');
const { buildData } = require('../../scripts/ui/data');
const { readImage } = require('../../scripts/ui/images');
const prototype = process.env.UI_TEST_URL || 'http://127.0.0.1:8080';
(async () => {
  let signin = false;
  let delayedContent = false;
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url === '/signin') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<main><h1>Sign in</h1></main>'); return; }
      if (signin === 'blank' && req.url.startsWith('/dashboard/')) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<header><button>Sign in</button></header><main></main>'); return; }
      if (signin && req.url.startsWith('/dashboard/')) { res.writeHead(302, { Location: '/signin' }); res.end(); return; }
      if (delayedContent && req.url.startsWith('/dashboard/')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<main><h1>Initial shell</h1><div class="animate-spin">Loading</div></main><script>setTimeout(() => { document.querySelector("main").innerHTML = "<h1>Loaded content</h1>"; }, 1200)</script>'); return;
      }
      const response = await fetch(prototype + req.url);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      let body = Buffer.from(await response.arrayBuffer());
      if (contentType.includes('text/html')) body = Buffer.from(body.toString().replace('</head>', '<style>h1.dashboard-page-title{font-size:43px!important}[data-prototype-banner],[aria-label="Prototype tools"]{display:none!important}</style></head>'));
      res.writeHead(response.status, { 'Content-Type': contentType }); res.end(body);
    } catch { res.writeHead(500); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const production = `http://127.0.0.1:${server.address().port}`;
  const output = path.join(process.cwd(), '.ui-audit/qa-capture'); fs.mkdirSync(output, { recursive: true });
  fs.rmSync(path.join(output, 'latest/results.json'), { force: true });
  const config = path.join(output, 'config.json'); fs.writeFileSync(config, JSON.stringify({ timeout: 5000, role: 'Local test fixture' }));
  const run = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/ui/audit.js', `--prototype=${prototype}`, `--production=${production}`, '--only=dashboard-api-keys', `--output=${output}`, `--config=${config}`, `--auth=${path.join(output, 'no-session.json')}`], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; child.stdout.on('data', data => stdout += data); child.stderr.on('data', data => stdout += data); child.on('error', reject); child.on('close', code => resolve({ code, stdout }));
  });
  try {
    const first = await run(); console.log(first.stdout); assert.equal(first.code, 0);
    const captured = JSON.parse(fs.readFileSync(path.join(output, 'latest/results.json'))).checks;
    assert.equal(captured.length, 2); assert.ok(captured.every(check => check.status === 'differences'));
    assert.ok(captured.find(check => check.scenario === 'default').findings.some(finding => finding.includes('fontSize: production 43px')));
    assert.ok(captured.every(check => check.screenshots.production && check.pixelDiff.pixels > 0));
    assert.ok(captured.every(check => Object.values(check.screenshots).every(src => src.endsWith('.webp'))));
    const defaultCheck = captured.find(check => check.scenario === 'default');
    const region = defaultCheck.regions[0];
    const regionImage = side => readImage(path.join(output, 'latest', path.basename(region.screenshots[side])));
    const prototypeRegion = await regionImage('prototype'), productionRegion = await regionImage('production');
    assert.equal(prototypeRegion.width, productionRegion.width);
    // A shifted fractional bounding box can add one crop pixel even when the table layout is unchanged.
    assert.ok(Math.abs(prototypeRegion.height - productionRegion.height) <= 1);
    assert.ok(defaultCheck.regions[0].ratio < defaultCheck.pixelDiff.ratio);
    const reportDir = fs.mkdtempSync(path.join(output, 'report-'));
    const exported = exportReport({ data: buildData(process.cwd()), report: { checks: captured }, latestDir: path.join(output, 'latest'), output: reportDir });
    assert.ok(exported.images >= 6);
    assert.deepEqual(fs.readdirSync(reportDir).sort(), ['images', 'index.html']);
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.route('**/ui-audit-data.json', request => request.fulfill({ json: { checks: captured } }));
      await page.route('**/ui-audit/*.webp', request => request.fulfill({ contentType: 'image/webp', body: fs.readFileSync(path.join(output, 'latest', path.basename(new URL(request.request().url()).pathname))) }));
      await page.goto(`${prototype}/ui/compare/`);
      const row = page.locator('[data-page-id=dashboard-api-keys]');
      await expect(row.locator('[data-side=prototype]').locator('img')).toHaveCount(2);
      await expect(row.locator('[data-side=production]').locator('img')).toHaveCount(2);
      await expect(row.locator('.ui-viz__differences').first()).toContainText('font-size: production 43px');
      await row.scrollIntoViewIfNeeded();
      await row.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
      await expect.poll(() => row.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.screenshot({ path: path.join(output, 'compare-preview.png') });
      const network = [];
      page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
      await page.goto(pathToFileURL(exported.filename).href);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Production comparison');
      await page.locator('details').evaluateAll(items => items.forEach(item => item.open = true));
      await page.locator('img').evaluateAll(items => items.forEach(item => item.loading = 'eager'));
      await expect.poll(() => page.locator('img').evaluateAll(items => items.every(item => item.complete && item.naturalWidth > 0))).toBe(true);
      assert.deepEqual(network, []);
      await page.getByRole('link', { name: 'API Keys', exact: true }).click();
      await page.screenshot({ path: path.join(output, 'report-preview.png') });
    } finally { await browser.close(); }
    const resultsFile = path.join(output, 'latest/results.json');
    const beforeIncremental = JSON.parse(fs.readFileSync(resultsFile));
    beforeIncremental.checks.push({ ...captured[0], key: 'unselected-page', pageId: 'dashboard-home' });
    fs.writeFileSync(resultsFile, JSON.stringify(beforeIncremental));
    fs.writeFileSync(config, JSON.stringify({ timeout: 5000, role: 'Another local test session' }));
    delayedContent = true;
    const delayed = await run();
    const loaded = JSON.parse(fs.readFileSync(path.join(output, 'latest/results.json'))).checks.find(check => check.pageId === 'dashboard-api-keys' && check.scenario === 'default');
    assert.equal(loaded.status, 'differences');
    assert.ok(loaded.findings.some(finding => finding.includes('Loaded content')));
    assert.ok(!loaded.findings.some(finding => finding.includes('Initial shell')));
    const afterIncremental = JSON.parse(fs.readFileSync(resultsFile));
    assert.ok(afterIncremental.checks.some(check => check.key === 'unselected-page' && check.screenshots.production), 'A different session must preserve unselected comparisons');
    afterIncremental.checks = afterIncremental.checks.filter(check => check.key !== 'unselected-page');
    fs.writeFileSync(resultsFile, JSON.stringify(afterIncremental));
    delayedContent = false;
    signin = 'blank';
    const emptyShell = await run(); console.log(emptyShell.stdout); assert.equal(emptyShell.code, 1);
    assert.ok(JSON.parse(fs.readFileSync(path.join(output, 'latest/results.json'))).checks.every(check => check.status === 'blocked'));
    signin = true;
    const second = await run(); console.log(second.stdout); assert.equal(second.code, 1);
    const blocked = JSON.parse(fs.readFileSync(path.join(output, 'latest/results.json'))).checks;
    assert.ok(blocked.every(check => check.status === 'blocked' && check.screenshots.prototype && !check.screenshots.production));
    assert.ok(blocked.every(check => !('at' in check) && !('lastSuccessfulAt' in check)));
    assert.ok(!fs.existsSync(path.join(output, 'history.json')));
    console.log('Capture checks passed: default and modal states, measured CSS differences, images, table comparison, portable offline report and preserved prototype images when production requires sign-in.');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
