const fs = require('node:fs');
const path = require('node:path');
const { readImage, writeImage } = require('./images');

async function migrateWebP(latestDir) {
  const resultsFile = path.join(latestDir, 'results.json');
  const original = fs.readFileSync(resultsFile, 'utf8');
  const report = JSON.parse(original);
  const converted = [];
  for (const entry of fs.readdirSync(latestDir, { withFileTypes: true })) {
    if (!entry.isFile() || !/^[a-z0-9][a-z0-9._-]*\.png$/i.test(entry.name)) continue;
    const source = path.join(latestDir, entry.name);
    const targetName = entry.name.replace(/\.png$/i, '.webp');
    const target = path.join(latestDir, targetName);
    const bytes = fs.readFileSync(source);
    if (!fs.existsSync(target)) await writeImage(bytes, target);
    const [before, after] = await Promise.all([readImage(bytes), readImage(target)]);
    if (before.width !== after.width || before.height !== after.height || !before.data.equals(after.data)) {
      throw new Error(`Pixel verification failed: ${entry.name}. Original PNGs and results were kept.`);
    }
    converted.push({ source, bytes, name: entry.name, targetName, size: fs.statSync(target).size });
  }
  if (!converted.length) return { images: 0, beforeBytes: 0, afterBytes: 0 };
  const urls = new Map(converted.map(item => [`/ui-audit/${item.name}`, `/ui-audit/${item.targetName}`]));
  const updated = JSON.stringify(report, (key, value) => typeof value === 'string' ? urls.get(value) || value : value, 2) + '\n';
  if (fs.readFileSync(resultsFile, 'utf8') !== original || converted.some(item => !fs.readFileSync(item.source).equals(item.bytes))) {
    throw new Error('Captures changed during conversion. Stop captures and retry; original PNGs were kept.');
  }
  // Publish verified references before removing originals, so interruption cannot break the report.
  fs.writeFileSync(`${resultsFile}.tmp`, updated);
  fs.renameSync(`${resultsFile}.tmp`, resultsFile);
  for (const item of converted) fs.unlinkSync(item.source);
  return { images: converted.length, beforeBytes: converted.reduce((total, item) => total + item.bytes.length, 0), afterBytes: converted.reduce((total, item) => total + item.size, 0) };
}

if (require.main === module) {
  const input = process.argv.find(arg => arg.startsWith('--input='))?.slice('--input='.length) || '.ui-audit';
  migrateWebP(path.resolve(__dirname, '../..', input, 'latest'))
    .then(result => console.log(JSON.stringify(result)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { migrateWebP };
