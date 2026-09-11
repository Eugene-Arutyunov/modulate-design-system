const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { captureSnapshot } = require('../../scripts/ui/snapshot-capture');
(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-test-'));
  const output = path.join(root, '.ui-audit/private');
  const snapshot = { html: '<html><body style="margin:0"><canvas width="20" height="20"></canvas></body></html>', styles: [], viewport: { width: 100, height: 100 } };
  try {
    await assert.rejects(captureSnapshot(snapshot, [], path.join(output, 'missing.webp')), /Canvas pixels missing/);
    const bytes = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#ff0000' } }).png().toBuffer();
    snapshot.canvases = [{ width: 20, height: 20, image: 'data:image/png;base64,' + bytes.toString('base64') }];
    await captureSnapshot(snapshot, [], path.join(output, 'chart.webp'));
    const pixel = await sharp(path.join(output, 'chart.webp')).extract({ left: 10, top: 10, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
    assert.deepEqual([...pixel], [255, 0, 0]);
    snapshot.canvases[0].width = 40;
    await assert.rejects(captureSnapshot(snapshot, [], path.join(output, 'wrong-size.webp')), /Canvas layout changed/);
    console.log('Canvas preservation, missing pixels and layout mismatch checks passed');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
