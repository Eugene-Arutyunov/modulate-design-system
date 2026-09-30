// Publishes reviewed candidates from a refresh run to ui-public/:
//   npm run ui:publish -- --approve=all
//   npm run ui:publish -- --approve=dashboard-usage:production,dashboard-billing:prototype
//   npm run ui:publish -- --run=.ui-audit/private/runs/20261001-120000 --approve=all
// Approval means a person (or agent) has looked at every approved image in full.
// Copies images, updates checks, hash receipts, fingerprints, capture dates and the
// Compare update date, removes superseded images and validates the result.
const fs = require('node:fs');
const path = require('node:path');
const { digest } = require('./model');
const { buildData } = require('./data');
const { validatePublished } = require('./published');
const PRODUCTION = 'https://platform.modulate.ai';

const PROTOTYPE_HOST = 'https://m-design-system.intuition.team';
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const itemKey = item => `${item.id}${item.scenario === 'default' ? '' : `/${item.scenario}`}:${item.side}`;
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

function latestRun(runsDir) {
  const runs = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter(name => fs.existsSync(path.join(runsDir, name, 'run.json'))).sort() : [];
  if (!runs.length) throw new Error('No refresh runs found. Run `npm run ui:refresh` first.');
  return path.join(runsDir, runs.at(-1));
}

function publish(root, runDir, approve, { today = localDate() } = {}) {
  const pub = path.join(root, 'ui-public');
  const run = readJSON(path.join(runDir, 'run.json'));
  const ready = run.items.filter(item => item.file && !item.error && !item.published);
  const chosen = approve === 'all' ? ready : ready.filter(item => approve.includes(itemKey(item)));
  if (approve !== 'all') for (const key of approve) if (!ready.some(item => itemKey(item) === key)) throw new Error(`Not an unpublished capture in this run: ${key}`);
  if (!chosen.length) throw new Error('Nothing to publish.');

  const routes = new Map(buildData(root).routes.map(route => [route.id, route]));
  const report = readJSON(path.join(pub, 'results.json'));
  const manifest = readJSON(path.join(pub, 'manifest.json'));
  const internalFile = path.join(pub, 'public-internal.json');
  const internal = fs.existsSync(internalFile) ? readJSON(internalFile) : { version: 1, images: {} };
  const superseded = new Set(), notesToCheck = new Set();

  for (const item of chosen) {
    const name = `${item.id}${item.scenario === 'default' ? '' : `-${item.scenario}`}-${run.stamp}-${item.side}.webp`;
    if (!/^[a-z0-9][a-z0-9._-]*\.webp$/.test(name)) throw new Error(`Invalid image name ${name}`);
    const dest = path.join(pub, name);
    if (fs.existsSync(dest)) throw new Error(`Refusing to overwrite ${name}`);
    fs.copyFileSync(path.join(runDir, item.file), dest);
    manifest.images[name] = digest(fs.readFileSync(dest));
    if (name.startsWith('internal-')) internal.images[name] = manifest.images[name];

    for (const id of item.ids || [item.id]) {
      const route = routes.get(id);
      let check = report.checks.find(c => c.pageId === id && c.scenario === item.scenario);
      if (!check) {
        check = { pageId: id, key: `${id}-${digest(item.scenario).slice(0, 10)}`, scenario: item.scenario, title: route?.title || id, status: 'prototype-only', screenshots: {} };
        report.checks.push(check);
      }
      const old = check.screenshots?.[item.side];
      if (old) superseded.add(path.basename(old));
      check.screenshots = { ...check.screenshots, [item.side]: `/ui-audit/${name}` };
      check.captured = { ...check.captured, [item.side]: today };
      // Compare shows this address above the screenshot.
      if (item.path) check.urls = { ...check.urls, [item.side]: (item.side === 'prototype' ? PROTOTYPE_HOST : PRODUCTION) + item.path };
      if (item.side === 'prototype') check.fingerprint = route.fingerprint;
      check.privacy = { version: 1, reviewed: true };
      const sides = Object.keys(check.screenshots);
      if (!sides.includes('prototype')) check.status = 'production-only';
      else if (!sides.includes('production')) check.status = 'prototype-only';
      else if (!['differences', 'match'].includes(check.status)) check.status = 'differences';
      if (check.reviewedElements?.length || check.prototypeNotes?.length) notesToCheck.add(check.title || check.pageId);
    }
    item.published = name;
  }

  const referenced = new Set(report.checks.flatMap(c => Object.values(c.screenshots || {}).map(url => path.basename(url))));
  let removed = 0;
  for (const name of superseded) {
    if (referenced.has(name)) continue;
    if (fs.existsSync(path.join(pub, name))) fs.rmSync(path.join(pub, name));
    delete manifest.images[name]; delete internal.images[name]; removed++;
  }
  writeJSON(path.join(pub, 'results.json'), report);
  manifest.results = digest(fs.readFileSync(path.join(pub, 'results.json')));
  writeJSON(path.join(pub, 'manifest.json'), manifest);
  writeJSON(internalFile, internal);
  writeJSON(path.join(runDir, 'run.json'), run);

  // Compare shows this as its content update date.
  const updated = path.join(root, 'src/includes/service/ui-updated.html');
  if (fs.existsSync(updated)) {
    const date = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    fs.writeFileSync(updated, fs.readFileSync(updated, 'utf8').replace(/<time datetime="[^"]*">[^<]*<\/time>/, `<time datetime="${today}">${date}</time>`));
  }
  validatePublished(root);
  return { published: chosen.map(itemKey), removed, notesToCheck: [...notesToCheck] };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '../..');
  const args = Object.fromEntries(process.argv.slice(2).map(arg => { const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true]; }));
  try {
    if (typeof args.approve !== 'string') throw new Error('Pass --approve=all or --approve=<id>:<side>,… after reviewing the images.');
    const runDir = typeof args.run === 'string' ? path.resolve(root, args.run) : latestRun(path.join(root, '.ui-audit/private/runs'));
    const result = publish(root, runDir, args.approve === 'all' ? 'all' : args.approve.split(','));
    console.log(`Published ${result.published.length} image(s); removed ${result.removed} superseded.`);
    if (result.notesToCheck.length) console.log(`Check that the difference notes still match the new screenshots:\n  ${result.notesToCheck.join('\n  ')}`);
    console.log('Next: npm run test:ui, look at /ui/compare/, then commit ui-public/ and src/includes/service/ui-updated.html.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { publish, latestRun, itemKey };
