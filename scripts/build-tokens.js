const fs = require('fs');
const path = require('path');
const { transform, browserslistToTargets } = require('lightningcss');
const browserslist = require('browserslist');

const tokenFiles = [
  'colors.css',
  'typography.css',
  'spacers.css',
  'layout.css',
  'ui-components.css',
  'animations.css',
];

const srcDir = path.join(__dirname, '../src/styles/tokens');
const distDir = path.join(__dirname, '../dist');

const targets = browserslistToTargets(browserslist('> 0.5%, last 2 versions, not dead'));

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

let bundleSource = '';

for (const file of tokenFiles) {
  const filePath = path.join(srcDir, file);
  const source = fs.readFileSync(filePath, 'utf8');
  bundleSource += `/* ${file} */\n${source}\n\n`;

  const { code } = transform({
    filename: file,
    code: Buffer.from(source),
    minify: true,
    targets,
  });
  fs.writeFileSync(path.join(distDir, file), code);
}

// copy shadcn
{
  const file = 'shadcn.css';
  const filePath = path.join(srcDir, file);
  const source = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(path.join(distDir, file), source);
}

const { code: bundleCode } = transform({
  filename: 'tokens.css',
  code: Buffer.from(bundleSource),
  minify: true,
  targets,
});
fs.writeFileSync(path.join(distDir, 'tokens.css'), bundleCode);

console.log('Tokens built to dist/');
