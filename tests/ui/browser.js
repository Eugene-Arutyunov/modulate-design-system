const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:8080';
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/ui/`);
    const ui = page.locator('#ui-structure').locator('..');
    await expect(ui.getByRole('navigation', { name: 'UI pages' }).getByRole('link')).toHaveCount(2);
    await expect(ui.locator('.m__segmented-nav a')).toHaveCount(2);
    await expect(ui.getByRole('link', { name: 'Scheme', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('header.header')).toHaveCount(0);
    await expect(ui.locator('.ui-viz__tabs + h1')).toHaveText('UI Scheme');
    await expect(ui.locator('#ui-structure > .ui-viz__legend')).toHaveCount(1);
    await expect(ui.locator('tbody > tr').first()).toBeVisible();
    const schemeTabY = (await ui.locator('.ui-viz__tabs').boundingBox()).y;
    const ids = await ui.locator('tbody > tr').evaluateAll(rows => rows.map(row => row.dataset.pageId));
    assert.ok(ids.includes('dashboard-home') && ids.includes('internal-users'));
    await expect(ui.locator('thead th')).toHaveText(['Route', 'Prototype', 'Production']);
    await expect(ui.locator('select,time')).toHaveCount(0);
    await expect(ui.getByText(/No route recorded|Updated|History|Progress|Scope/)).toHaveCount(0);
    await expect(ui.locator('[data-page-id=landing] td').nth(1)).toHaveText('—');
    await expect(ui.locator('[data-page-id=docs] td').nth(2)).toHaveText('—');
    const screenshotDir = path.join(process.cwd(), '.ui-audit/qa'); fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, 'scheme-desktop.png') });
    await ui.getByRole('link', { name: 'Compare', exact: true }).click();
    await expect(page).toHaveURL(`${base}/ui/compare/`);
    await expect(page.locator('header.header')).toHaveCount(0);
    await expect(ui.locator('.ui-viz__legend')).toHaveCount(0);
    await expect(ui.locator('.ui-viz__tabs + h1')).toHaveText('UI Compare');
    await expect(ui.locator('.ui-viz__tabs')).toBeVisible();
    assert.equal((await ui.locator('.ui-viz__tabs').boundingBox()).y, schemeTabY, 'Both pages keep the same navigation position');
    await expect(ui.locator('tbody > tr')).toHaveCount(ids.length);
    await page.goBack();
    await expect(page).toHaveURL(`${base}/ui/`);
    await expect(ui.getByRole('link', { name: 'Scheme', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.goForward();
    await expect(page).toHaveURL(`${base}/ui/compare/`);
    await expect(ui.locator('tbody > tr')).toHaveCount(ids.length);
    assert.deepEqual(await ui.locator('tbody > tr').evaluateAll(rows => rows.map(row => row.dataset.pageId)), ids);
    await expect(ui.locator('thead th')).toHaveText(['Route', 'Prototype', 'Production']);
    const data = await (await page.request.get(`${base}/ui-audit-data.json`)).json();
    assert.ok(!('history' in data));
    for (const check of data.checks.filter(check => check.screenshots?.production)) {
      const row = ui.locator(`[data-page-id="${check.pageId}"]`);
      const productionImage = row.locator('[data-side=production]').locator(`img[src="${check.screenshots.production}"]`);
      await expect(productionImage).toHaveCount(1);
      await productionImage.evaluate(image => image.loading = 'eager');
      await expect.poll(() => productionImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      if (check.reviewedFindings?.length) await expect(row.locator(`[data-scenario="${check.scenario}"] .ui-viz__differences`)).toContainText(check.reviewedFindings[0]);
    }
    const tabStyle = await ui.getByRole('link', { name: 'Compare', exact: true }).evaluate(tab => {
      const baseline = document.createElement('nav'); baseline.className = 'm__segmented-nav';
      baseline.innerHTML = '<ul><li><a href="#">Compare</a></li></ul>'; document.body.append(baseline);
      const actual = getComputedStyle(tab), expected = getComputedStyle(baseline.querySelector('a'));
      const values = [actual.fontSize, expected.fontSize, actual.padding, expected.padding]; baseline.remove(); return values;
    });
    assert.equal(tabStyle[0], tabStyle[1], 'Tabs must use the normal DS font size');
    assert.equal(tabStyle[2], tabStyle[3], 'Tabs must use DS padding');
    for (const check of data.checks) {
      const pair = ui.locator(`[data-page-id="${check.pageId}"] [data-scenario="${check.scenario}"]`);
      const comments = pair.locator('.ui-viz__differences');
      if (!check.screenshots?.production || !check.screenshots?.prototype) await expect(comments).toHaveCount(0);
      else {
        assert.ok(!/[А-Яа-яЁё]/.test(await comments.allTextContents().then(items => items.join(''))), 'Differences must be in English');
        for (const side of ['prototype', 'production']) {
          await expect(pair.locator(`[data-side=${side}] .ui-viz__route-path`)).toHaveAttribute('href', check.urls[side]);
        }
      }
    }
    const multi = ui.locator('[data-page-id="dashboard-api-keys"]');
    await multi.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
    await expect.poll(() => multi.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const positions = await multi.locator('.ui-viz__comparison-state').evaluateAll(pairs => pairs.map(pair => {
      const figures = [...pair.querySelectorAll('figure')].map(figure => figure.getBoundingClientRect());
      const images = [...pair.querySelectorAll('img')].map(image => image.getBoundingClientRect());
      return { tops: figures.map(rect => rect.top), bottoms: figures.map(rect => rect.bottom), imageTops: images.map(rect => rect.top), comments: pair.querySelector('.ui-viz__differences')?.getBoundingClientRect().bottom, bottom: pair.getBoundingClientRect().bottom };
    }));
    for (const position of positions) {
      assert.equal(position.tops[0], position.tops[1], 'State captions align across columns');
      assert.equal(position.imageTops[0], position.imageTops[1], 'Images align even when URLs wrap');
      if (position.comments !== undefined) assert.ok(position.comments <= Math.min(...position.tops), 'Comments precede both screenshots');
    }
    if (positions.length > 1) assert.ok(positions[1].tops[0] >= positions[0].bottom, 'Next state follows the previous pair and its comments');
    const partial = data.checks.find(check => check.scenario === 'page-2' && !check.screenshots?.production);
    if (partial) {
      const route = ui.locator(`[data-page-id="${partial.pageId}"]`);
      await route.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
      await expect.poll(() => route.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      for (const pair of await route.locator('.ui-viz__comparison-state').all()) {
        const tops = await pair.locator('figure').evaluateAll(figures => figures.map(figure => figure.getBoundingClientRect().top));
        assert.equal(tops[0], tops[1], 'Missing production must not shift the next state');
      }
      await route.screenshot({ path: path.join(screenshotDir, 'compare-aligned-missing-production.png') });
    }
    const captured = data.checks.find(check => check.pageId === 'dashboard-api-keys' && check.screenshots?.prototype);
    assert.ok(captured, 'Capture prototype screenshots before running browser checks');
    const preview = ui.locator('[data-page-id=dashboard-api-keys] [data-side=prototype]').locator('img').first();
    await preview.scrollIntoViewIfNeeded();
    await expect.poll(() => preview.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const image = await page.request.get(`${base}${captured.screenshots.prototype}`);
    assert.equal(image.status(), 200); assert.equal(image.headers()['content-type'], captured.screenshots.prototype.endsWith('.webp') ? 'image/webp' : 'image/png');
    assert.equal((await page.request.get(`${base}/ui-audit/auth.json`)).status(), 404);
    assert.equal((await page.request.get(`${base}/ui-audit/..%2Fauth.json`)).status(), 404);
    const reviewedRow = ui.locator('[data-page-id="conversations-review"]');
    if (data.checks.some(check => check.pageId === 'conversations-review' && check.screenshots?.production)) {
      await reviewedRow.screenshot({ path: path.join(screenshotDir, 'compare-production-review.png') });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(screenshotDir, 'compare-desktop.png') });
    await page.reload();
    await expect(ui.getByRole('link', { name: 'Compare', exact: true })).toHaveAttribute('aria-current', 'page');
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const label of ['Scheme', 'Compare']) {
        await ui.getByRole('link', { name: label, exact: true }).click();
        await expect(ui.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
        await expect(ui.locator('tbody > tr')).toHaveCount(ids.length);
        if (label === 'Scheme') await page.screenshot({ path: path.join(screenshotDir, `scheme-${width}.png`) });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${width} in ${label}`);
      }
      await page.screenshot({ path: path.join(screenshotDir, `compare-${width}.png`) });
    }
    const broken = data.checks.find(check => check.reviewedFindings?.length && check.screenshots?.production);
    if (broken) {
      await page.route(`**${broken.screenshots.production}`, request => request.fulfill({ status: 404, body: '' }));
      await page.reload();
      const pair = ui.locator(`[data-page-id="${broken.pageId}"] [data-scenario="${broken.scenario}"]`);
      await pair.locator('[data-side=production]').scrollIntoViewIfNeeded();
      await expect(pair.locator('[data-side=production] img')).toHaveCount(0);
      await expect(pair.locator('.ui-viz__differences')).toHaveCount(0);
      await page.unroute(`**${broken.screenshots.production}`);
    }
    await page.route('**/ui-audit-data.json', request => request.fulfill({ status: 503, body: 'Unavailable' }));
    await ui.getByRole('link', { name: 'Compare', exact: true }).click();
    await expect(ui.getByRole('alert')).toContainText('Could not load comparison screenshots');
    await page.unroute('**/ui-audit-data.json');
    await ui.getByRole('link', { name: 'Compare', exact: true }).click();
    await expect(ui.getByRole('alert')).toHaveCount(0);
    await page.evaluate(() => document.body.classList.add('dark-mode'));
    await page.screenshot({ path: path.join(screenshotDir, 'compare-dark.png') });
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: two DS tabs, shared complete table, dashes, visible screenshots, dev-server image delivery, responsive layout and dark theme.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
