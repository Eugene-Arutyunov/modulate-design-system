const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildReview } = require('../../src/assets/service/ui-review');
const routes = [{ id: 'a', fingerprint: 'current' }, { id: 'b', fingerprint: 'current' }];
const check = (pageId, extra = {}) => ({ key: pageId, pageId, title: pageId, scenario: 'default', status: 'differences', fingerprint: 'current', viewport: { width: 1440, height: 1000 }, theme: 'light', role: 'Admin', screenshots: { prototype: '/ui-audit/a.webp', production: '/ui-audit/b.webp' }, findings: [`H1:${pageId} · fontWeight: production 700 → prototype 600.`, '12.34% of image pixels differ. Review layout and live data separately.', 'Full-page dimensions differ.'], ...extra });

test('shared heading weight is described once, with measured values and links to both screens', () => {
  const a = check('a'), b = check('b');
  const review = buildReview([a, b], routes);
  assert.equal(review.shared.length, 1);
  assert.equal(review.shared[0].title, 'Heading weight');
  assert.equal(review.shared[0].prototype, '600'); assert.equal(review.shared[0].production, '700');
  assert.match(review.shared[0].recommendation, /--m__font-weight-bold/);
  assert.equal(review.shared[0].affected.length, 2);
  assert.deepEqual(review.byCheck.get(a).elements, []);
  assert.equal(review.byCheck.get(a).shared[0], review.shared[0]);
});
test('states of one page, stale captures and different capture contexts are not global evidence', () => {
  const a = check('a');
  for (const b of [check('a', { key: 'a-modal', scenario: 'modal' }), check('b', { fingerprint: 'old' }), check('b', { theme: 'dark' }), check('b', { role: 'Developer' }), check('b', { viewport: { width: 390, height: 1000 } }), check('b', { status: 'blocked' })]) {
    assert.equal(buildReview([a, b], routes).shared.length, 0);
  }
});
test('reviewed element differences and data caveats remain separate from raw detected controls', () => {
  const a = check('a', { reviewedElements: [{ element: 'Heading', difference: 'Wrong text.' }], reviewedFindings: ['Old prose conclusion.'], comparisonNotes: ['The captured organization is empty.'], findings: ['Controls only in prototype: button: Delete.', '45% of image pixels differ.'] });
  const item = buildReview([a], routes).byCheck.get(a);
  assert.deepEqual(item.elements, a.reviewedElements);
  assert.deepEqual(item.notes, a.comparisonNotes);
  assert.equal(item.reviewed, true);
});
test('a missing image has no comparison notes and unreviewed pixel percentages stay out of element lists', () => {
  const a = check('a'), b = check('b', { screenshots: { prototype: '/ui-audit/a.webp' } });
  const review = buildReview([a, b], routes);
  assert.equal(review.byCheck.has(b), false); assert.equal(review.shared.length, 0);
  assert.equal(review.byCheck.get(a).elements.length, 1);
  assert.match(review.byCheck.get(a).elements[0].difference, /font-weight: production 700/);
  assert.equal(review.byCheck.get(a).reviewed, false);
});
test('a different CSS property remains local when the shared property is extracted', () => {
  const a = check('a', { findings: ['H1:a · fontWeight: production 700 → prototype 600; padding: production 12px → prototype 8px.'] }), b = check('b');
  const review = buildReview([a, b], routes);
  assert.equal(review.shared.length, 1);
  assert.deepEqual(review.byCheck.get(a).elements, [{ element: 'Heading “a”', difference: 'padding: production 12px → prototype 8px.' }]);
});
