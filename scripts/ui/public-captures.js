const fs = require('node:fs');
const path = require('node:path');
const { digest } = require('./model');

function isPublicCapture(base, name) {
  if (!name.startsWith('internal-')) return true;
  if (path.basename(name) !== name) return false;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(base, 'public-internal.json'), 'utf8'));
    return manifest.version === 1 && manifest.images?.[name] === digest(fs.readFileSync(path.join(base, name)));
  } catch { return false; }
}
function publicChecks(checks, base) {
  return checks.filter(check => !check.pageId?.startsWith('internal-') || (
    check.privacy?.version === 1 && check.privacy?.reviewed === true &&
    Object.values(check.screenshots || {}).length > 0 &&
    Object.values(check.screenshots).every(url => typeof url === 'string' && /^\/ui-audit\/internal-[a-z0-9._-]+\.webp$/i.test(url) && isPublicCapture(base, path.basename(url)))
  ));
}
module.exports = { isPublicCapture, publicChecks };
