const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('Eleventy loads the UI data template with the active Node runtime', () => {
  const root = path.resolve(__dirname, '../..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-template-'));
  try {
    const result = spawnSync(process.execPath, [
      path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs'),
      '--input=src/service/ui-data.11ty.js',
      `--output=${output}`,
      '--quiet',
    ], { cwd: root, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
    const data = JSON.parse(fs.readFileSync(path.join(output, 'ui-data.json'), 'utf8'));
    assert.ok(data.routes.some(route => route.id === 'dashboard-api-keys'));
    assert.ok(!('history' in data) && !('updatedAt' in data));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
