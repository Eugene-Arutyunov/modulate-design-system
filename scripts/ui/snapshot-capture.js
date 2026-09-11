const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { captureCandidate } = require('./semantic-capture');
const fontCache = new Map();
const os = require('node:os');
const { createHash } = require('node:crypto');

// Render a private DOM snapshot when the interactive browser only supports reading.
// No application scripts, authentication, event handlers, or live API requests run.
async function captureSnapshot(snapshot, rules, output) {
  const css = snapshot.styles.map(sheet => sheet.css.replace(/url\(["']?([^"')]+)["']?\)/g, (_match, value) => {
    const url = new URL(value, sheet.href || 'https://platform.modulate.ai/');
    if (url.protocol !== 'https:' || url.hostname !== 'platform.modulate.ai' ||
        !url.pathname.startsWith('/_next/static/media/') || !url.pathname.endsWith('.woff2') || url.search) {
      throw new Error('Snapshot requires review of an unsupported CSS asset');
    }
    if (!fontCache.has(url.href)) {
      const directory = path.join(os.tmpdir(), 'ui-capture-public-fonts');
      fs.mkdirSync(directory, { recursive: true });
      const file = path.join(directory, createHash('sha256').update(url.href).digest('hex') + '.woff2');
      const bytes = fs.existsSync(file) ? fs.readFileSync(file) : execFileSync('curl', ['-fsS', '--retry', '2', '--max-time', '15', url.href]);
      if (!fs.existsSync(file)) fs.writeFileSync(file, bytes);
      fontCache.set(url.href, bytes.toString('base64'));
    }
    return `url("data:font/woff2;base64,${fontCache.get(url.href)}")`;
  })).join('\n');
  const sprite = snapshot.html.includes('/icons.svg#') ? execFileSync('curl', ['-fsS', '--retry', '2', '--max-time', '15', 'https://platform.modulate.ai/icons.svg']).toString() : '';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: snapshot.viewport || { width: 1440, height: 1000 } });
    await page.route('**/*', route => route.abort());
    // Parse in an inert document first; strip executable markup before rendering.
    const html = await page.evaluate(({ html, css, sprite }) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('script,link,style,iframe,object,embed,base,meta[http-equiv]').forEach(e => e.remove());
      for (const e of doc.querySelectorAll('*')) {
        for (const attr of [...e.attributes]) if (/^on/i.test(attr.name)) e.removeAttribute(attr.name);
      }
      if (sprite) {
        const symbols = new DOMParser().parseFromString(sprite, 'image/svg+xml').documentElement;
        symbols.querySelectorAll('script').forEach(e => e.remove());
        symbols.setAttribute('style', 'display:none'); doc.body.prepend(doc.importNode(symbols, true));
        doc.querySelectorAll('use[href^="/icons.svg#"]').forEach(e => e.setAttribute('href', e.getAttribute('href').replace('/icons.svg', '')));
      }
      const style = doc.createElement('style'); style.textContent = css; doc.head.append(style);
      return '<!doctype html>' + doc.documentElement.outerHTML;
    }, { html: snapshot.html, css, sprite });
    await page.setContent(html);
    if (snapshot.canvases?.length) {
      await page.evaluate(async captures => {
        const canvases = [...document.querySelectorAll('canvas')];
        if (canvases.length !== captures.length) throw new Error('Canvas count changed');
        for (const [index, capture] of captures.entries()) {
          if (!/^data:image\/png;base64,/.test(capture.image || '')) throw new Error('Missing reviewed canvas image');
          const canvas = canvases[index], bounds = canvas.getBoundingClientRect();
          if (Math.abs(bounds.width - capture.width) > 1 || Math.abs(bounds.height - capture.height) > 1) throw new Error('Canvas layout changed');
          const image = new Image(); image.src = capture.image; await image.decode();
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        }
      }, snapshot.canvases);
    } else if (await page.locator('canvas').count()) {
      throw new Error('Canvas pixels missing; capture cancelled');
    }
    return await captureCandidate(page, rules, output);
  } finally { await browser.close(); }
}
if (require.main === module) {
  const [input, rulesFile, output] = process.argv.slice(2);
  if (!input || !rulesFile || !output) throw new Error('Usage: node scripts/ui/snapshot-capture.js private-snapshot.json rules.json .ui-audit/private/candidates/name.webp');
  captureSnapshot(JSON.parse(fs.readFileSync(path.resolve(input))), JSON.parse(fs.readFileSync(path.resolve(rulesFile))), output)
    .then(result => console.log(result.filename)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { captureSnapshot };
