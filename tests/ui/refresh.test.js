const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { planCaptures } = require('../../scripts/ui/refresh');
const { publish } = require('../../scripts/ui/publish');
const { digest } = require('../../scripts/ui/model');
const { validatePublished } = require('../../scripts/ui/published');
const { checkCanvasText } = require('../../scripts/ui/anonymize');

const route = (id, fingerprint, available = true) => ({ id, title: id, fingerprint, available, target: available ? { id, route: `/${id}/` } : null });
const NOW = Date.parse('2026-10-01T12:00:00Z');

test('plans only stale sides by default', () => {
  const routes = [route('fresh', 'f1'), route('changed', 'new'), route('old-prod', 'f3'), route('internal-x', 'f4', false), route('report', 'f5')];
  const checks = [
    { pageId: 'fresh', scenario: 'default', fingerprint: 'f1', screenshots: { prototype: 'a', production: 'b' }, captured: { production: '2026-09-30' } },
    { pageId: 'changed', scenario: 'default', fingerprint: 'old', screenshots: { prototype: 'a' } },
    { pageId: 'old-prod', scenario: 'default', fingerprint: 'f3', screenshots: { prototype: 'a', production: 'b' }, captured: { production: '2026-07-01' } },
    { pageId: 'internal-x', scenario: 'default', screenshots: { production: 'b' } },
    { pageId: 'report', scenario: 'default', fingerprint: 'f5', screenshots: { prototype: 'a', production: 'b' } },
  ];
  const jobs = { fresh: { url: '/f' }, 'old-prod': { url: '/o' }, 'internal-x': { url: '/i' }, report: { same_as: 'fresh' } };
  const plan = planCaptures({ routes, checks, jobs, now: NOW });
  assert.deepEqual(plan.map(p => `${p.id}:${p.side}:${p.reason}`), [
    'changed:prototype:prototype changed',
    'old-prod:production:older than 30 days',
    'internal-x:production:capture date unknown',
  ]);
  // A shared production view is captured once and applied to every row that reuses it.
  const forced = planCaptures({ routes, checks, jobs, only: ['fresh'], side: 'production', now: NOW });
  assert.deepEqual(forced.map(p => [p.id, p.ids]), [['fresh', ['fresh', 'report']]]);
});

test('publishes approved candidates with receipts and removes superseded images', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-publish-'));
  try {
    fs.mkdirSync(path.join(root, 'src/service'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/includes/service'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src/service/ui.yaml'), 'current:\n  - {id: internal-demo, route: /demo, sections: []}\ntarget:\n  - {id: internal-demo, route: —, sections: []}\n');
    fs.writeFileSync(path.join(root, 'src/includes/service/ui-updated.html'), '<p>Updated <time datetime="2026-01-01">1 January 2026</time></p>\n');
    const pub = path.join(root, 'ui-public'); fs.mkdirSync(pub);
    fs.writeFileSync(path.join(pub, 'internal-demo-old.webp'), 'old pixels');
    const results = JSON.stringify({ version: 1, checks: [{ pageId: 'internal-demo', scenario: 'default', status: 'production-only', privacy: { version: 1, reviewed: true }, screenshots: { production: '/ui-audit/internal-demo-old.webp' }, reviewedElements: [{ element: 'Table', difference: 'x' }] }] });
    fs.writeFileSync(path.join(pub, 'results.json'), results);
    fs.writeFileSync(path.join(pub, 'manifest.json'), JSON.stringify({ version: 1, results: digest(results), images: { 'internal-demo-old.webp': digest('old pixels') } }));
    fs.writeFileSync(path.join(pub, 'public-internal.json'), JSON.stringify({ version: 1, images: { 'internal-demo-old.webp': digest('old pixels') } }));
    const run = path.join(root, '.ui-audit/private/runs/20261001-120000'); fs.mkdirSync(run, { recursive: true });
    fs.writeFileSync(path.join(run, 'internal-demo-production.webp'), 'new pixels');
    fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify({ stamp: '20261001-120000', items: [
      { id: 'internal-demo', ids: ['internal-demo'], scenario: 'default', side: 'production', file: 'internal-demo-production.webp', path: '/internal/demo' },
      { id: 'internal-demo', scenario: 'default', side: 'prototype', error: 'Page shows a load error' },
    ] }));

    assert.throws(() => publish(root, run, ['internal-demo:prototype']), /Not an unpublished capture/);
    const result = publish(root, run, 'all', { today: '2026-10-01' });
    assert.deepEqual(result, { published: ['internal-demo:production'], removed: 1, notesToCheck: ['internal-demo'] });
    const name = 'internal-demo-20261001-120000-production.webp';
    assert.deepEqual(fs.readdirSync(pub).filter(f => f.endsWith('.webp')), [name]);
    const check = validatePublished(root).report.checks[0];
    assert.equal(check.screenshots.production, `/ui-audit/${name}`);
    assert.deepEqual(check.captured, { production: '2026-10-01' });
    assert.deepEqual(check.urls, { production: 'https://platform.modulate.ai/internal/demo' });
    assert.equal(JSON.parse(fs.readFileSync(path.join(pub, 'public-internal.json'))).images[name], digest('new pixels'));
    assert.match(fs.readFileSync(path.join(root, 'src/includes/service/ui-updated.html'), 'utf8'), /datetime="2026-10-01">1 October 2026</);
    // A published candidate cannot be published twice.
    assert.throws(() => publish(root, run, 'all'), /Nothing to publish/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('chart labels with private values block the capture', () => {
  assert.doesNotThrow(() => checkCanvasText(['Velma', 'Sep 12', '1,204', 'Requests'], { originals: ['Acme Corp'], stopwords: ['Eugene'] }));
  assert.throws(() => checkCanvasText(['Acme Corp'], { originals: ['Acme Corp'] }), /Chart labels/);
  assert.throws(() => checkCanvasText(['a.person@customer.io'], {}), /Chart labels/);
  assert.throws(() => checkCanvasText(['eugene'], { stopwords: ['Eugene'] }), /Chart labels/);
});
