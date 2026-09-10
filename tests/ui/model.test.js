const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkStatus, assertScheme } = require('../../scripts/ui/model');
const { structuralFindings, pixelDiff, scenarios } = require('../../scripts/ui/audit');
const { fileFor } = require('../../scripts/ui/serve');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PNG } = require('pngjs');

test('a previous comparison is stale after a prototype change, and failures do not pass', () => {
  assert.equal(checkStatus(null, 'v2'), 'not-checked');
  assert.equal(checkStatus({ status: 'match', fingerprint: 'v1' }, 'v2'), 'stale');
  assert.equal(checkStatus({ status: 'blocked', fingerprint: 'v2' }, 'v2'), 'blocked');
  assert.equal(checkStatus({ status: 'match', fingerprint: 'v2' }, 'v2'), 'match');
});
test('invalid or duplicate stable IDs fail validation', () => { assert.throws(() => assertScheme({ current: [], target: [{ id: 'a' }, { id: 'a' }] }), /duplicate/); });
test('each URL of a grouped page is included in default capture coverage', () => { assert.equal(scenarios({ target: { routes: ['/new/', '/edit/'] } }).length, 2); });
test('structural comparison reports concrete property changes and identical captures stay clean', () => {
  const a = { headings: [{ text: 'API Keys', level: 'H1' }], columns: ['Name'], controls: [], styles: [{ key: 'H1:API Keys', fontSize: '32px', fontWeight: '500', padding: '0px', borderRadius: '0px' }] };
  assert.deepEqual(structuralFindings(a, a), []);
  const b = structuredClone(a); b.styles[0].fontSize = '24px';
  assert.match(structuralFindings(a, b)[0], /production 24px → prototype 32px/);
});
test('screenshot comparison preserves dimensions instead of resizing away layout differences', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-pixels-'));
  try {
    for (const [name, width] of [['a', 2], ['b', 3]]) { const png = new PNG({ width, height: 2 }); png.data.fill(255); fs.writeFileSync(path.join(dir, name + '.png'), PNG.sync.write(png)); }
    const result = await pixelDiff(path.join(dir, 'a.png'), path.join(dir, 'b.png'), path.join(dir, 'diff.png'));
    assert.equal(result.sameDimensions, false); assert.ok(result.pixels > 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('local artifact serving rejects traversal outside its root', () => {
  assert.equal(fileFor('/tmp/ui-root', '/../secret'), null);
  assert.equal(fileFor('/tmp/ui-root', '/page/index.html'), '/tmp/ui-root/page/index.html');
});
