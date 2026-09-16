const fs = require('node:fs');
const path = require('node:path');
const { digest } = require('./model');
const PUBLIC_DIR = 'ui-public';
function validatePublished(root) {
  const base = path.join(root, PUBLIC_DIR);
  const file = path.join(base, 'results.json');
  if (!fs.existsSync(file)) return null;
  const report = JSON.parse(fs.readFileSync(file));
  const receipt = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json')));
  if (receipt.version !== 1 || receipt.results !== digest(fs.readFileSync(file)) || !Array.isArray(report.checks)) throw Error('Public UI review data changed without a new receipt');
  for (const check of report.checks) {
    if (check.privacy?.version !== 1 || check.privacy.reviewed !== true) throw Error('Unreviewed public UI check');
    for (const [side, url] of Object.entries(check.screenshots || {})) {
      if (!['prototype', 'production'].includes(side) || !/^\/ui-audit\/[a-z0-9][a-z0-9._-]*\.webp$/.test(url)) throw Error('Invalid public UI image');
      const name = path.basename(url), image = path.join(base, name);
      if (!fs.realpathSync(image).startsWith(fs.realpathSync(base) + path.sep) || receipt.images?.[name] !== digest(fs.readFileSync(image))) throw Error('Public UI image changed without review');
    }
  }
  return { base, report };
}
function publishAssets(root, output) {
  const published = validatePublished(root);
  if (!published) return;
  const dest = path.join(output, 'ui-audit');
  fs.mkdirSync(dest, { recursive: true });
  for (const name of new Set(published.report.checks.flatMap(c => Object.values(c.screenshots || {}).map(url => path.basename(url))))) fs.copyFileSync(path.join(published.base, name), path.join(dest, name));
}
module.exports = { validatePublished, publishAssets };
