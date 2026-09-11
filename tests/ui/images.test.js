const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PNG } = require('pngjs');
const { readImage, writeImage } = require('../../scripts/ui/images');
const { pixelDiff } = require('../../scripts/ui/audit');
const { migrateWebP } = require('../../scripts/ui/migrate-webp');

function fixture() {
  const png = new PNG({ width: 32, height: 16 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = i % 251;
    png.data[i + 1] = (i * 3) % 253;
    png.data[i + 2] = (i * 7) % 255;
    png.data[i + 3] = [0, 128, 255][(i / 4) % 3];
  }
  return PNG.sync.write(png);
}

test('WebP preserves every RGBA byte and produces the same pixel comparison as PNG', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-webp-'));
  try {
    const bytes = fixture(), png = path.join(dir, 'original.png'), webp = path.join(dir, 'encoded.webp');
    fs.writeFileSync(png, bytes);
    await writeImage(bytes, webp);
    const actual = await readImage(webp), expected = PNG.sync.read(bytes);
    assert.equal(actual.width, expected.width); assert.equal(actual.height, expected.height);
    assert.deepEqual(actual.data, expected.data);
    const result = await pixelDiff(png, webp, path.join(dir, 'diff.webp'));
    assert.equal(result.pixels, 0); assert.equal(result.sameDimensions, true);
    assert.equal((await readImage(path.join(dir, 'diff.webp'))).width, expected.width);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('migration preserves report metadata and nested region URLs, deletes verified PNGs and is repeatable', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-webp-migrate-'));
  try {
    fs.writeFileSync(path.join(dir, 'capture.png'), fixture());
    fs.writeFileSync(path.join(dir, 'region.png'), fixture());
    const report = { contextId: 'preserve-context', checks: [{ key: 'a', reviewedFindings: ['Keep this review.'], pixelDiff: { pixels: 12 }, screenshots: { prototype: '/ui-audit/capture.png' }, regions: [{ id: 'table', screenshots: { diff: '/ui-audit/region.png' } }] }] };
    fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(report));
    const result = await migrateWebP(dir);
    assert.equal(result.images, 2); assert.ok(result.beforeBytes > 0 && result.afterBytes > 0);
    const expected = structuredClone(report);
    expected.checks[0].screenshots.prototype = '/ui-audit/capture.webp';
    expected.checks[0].regions[0].screenshots.diff = '/ui-audit/region.webp';
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'results.json'))), expected);
    assert.ok(!fs.existsSync(path.join(dir, 'capture.png')) && !fs.existsSync(path.join(dir, 'region.png')));
    assert.deepEqual(fs.readdirSync(dir).sort(), ['capture.webp', 'region.webp', 'results.json']);
    assert.equal((await migrateWebP(dir)).images, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a conflicting WebP leaves the original PNG and report untouched', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-webp-conflict-'));
  try {
    const original = fixture();
    fs.writeFileSync(path.join(dir, 'capture.png'), original);
    const other = new PNG({ width: 2, height: 2 }); other.data.fill(255);
    await writeImage(PNG.sync.write(other), path.join(dir, 'capture.webp'));
    const report = JSON.stringify({ checks: [{ screenshots: { prototype: '/ui-audit/capture.png' } }] });
    fs.writeFileSync(path.join(dir, 'results.json'), report);
    await assert.rejects(migrateWebP(dir), /Pixel verification failed/);
    assert.equal(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'), report);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'capture.png')), original);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
