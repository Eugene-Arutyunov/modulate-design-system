const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
fs.mkdirSync(path.join(root, '.ui-audit'), { recursive: true });
const child = spawn(process.execPath, [require.resolve('@playwright/test/cli'), 'codegen', '--save-storage=.ui-audit/auth.json', 'https://platform.modulate.ai'], { cwd: root, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
