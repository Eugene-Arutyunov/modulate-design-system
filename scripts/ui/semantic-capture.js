const fs = require('node:fs');
const path = require('node:path');
const { writeImage } = require('./images');

// Runs only in a capture browser. Explicit selectors must be reviewed per state.
// Never dispatch events, submit forms, change attributes or adjust presentation.
function replaceFields(rules) {
  const edits = [];
  const hash = value => [...value].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const sample = (value, kind) => {
    if (!value.trim() || /^[—–\-\s]+$/.test(value)) return value;
    const n = hash(value.trim().toLowerCase());
    const names = ['Alex Morgan', 'Jamie Parker', 'Robin Taylor', 'Casey Jordan'];
    const organizations = ['Northstar Labs', 'Cedar Analytics', 'Harbor Studio', 'Summit Research'];
    if (kind === 'name') return names[n % names.length];
    if (kind === 'organization') return organizations[n % organizations.length];
    if (kind === 'email') return `${names[n % names.length].toLowerCase().replace(' ', '.')}@example.com`;
    if (kind === 'identity') return !/[a-z\d]/i.test(value) ? value : value.includes('@') ? sample(value, 'email') : sample(value, 'name');
    if (kind === 'keyName') return ['Development', 'Staging service', 'Production service', 'Integration tests'][n % 4];
    if (kind === 'code' || kind === 'number') {
      let i = 0;
      return value.replace(kind === 'number' ? /\d/g : /[a-z\d]/gi, c => {
        const k = (n + ++i * 7) % 10;
        if (/\d/.test(c)) return String(i === 1 ? 1 + k % 9 : k);
        const letter = String.fromCharCode(97 + (n + i * 11) % 26);
        return c === c.toUpperCase() ? letter.toUpperCase() : letter;
      });
    }
    throw new Error(`Unsupported field kind: ${kind}`);
  };
  const visited = new Set();
  // Prepare everything first so an invalid selector/rule cannot leave half a page changed.
  for (const rule of rules) {
    const elements = [...document.querySelectorAll(rule.selector)];
    if (!elements.length && !rule.optional) throw new Error(`Missing capture field: ${rule.selector}`);
    for (const element of elements) {
      let targets;
      if (element.matches('input,textarea')) targets = [element];
      else {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        targets = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.textContent.trim() && !node.parentElement.closest('script,style,svg')) targets.push(node);
        }
      }
      if (!targets.length && !rule.optional) throw new Error(`Empty capture field: ${rule.selector}`);
      for (const target of targets) {
        if (rule.contains && !String(target.nodeType === Node.TEXT_NODE ? target.textContent : target.value).includes(rule.contains)) continue;
        if (visited.has(target)) throw new Error('Overlapping capture selectors');
        visited.add(target);
        const property = target.nodeType === Node.TEXT_NODE ? 'textContent' : 'value';
        const original = target[property];
        const replacement = rule.text !== undefined ? rule.text : sample(original, rule.kind);
        edits.push({ target, property, original, replacement });
      }
    }
  }
  for (const edit of edits) edit.target[edit.property] = edit.replacement;
  return edits;
}

/** Separate private candidate; never overwrites originals or grants public approval. */
async function captureCandidate(page, rules, filename) {
  if (!filename.endsWith('.webp')) throw new Error('Use lossless .webp');
  const output = path.resolve(filename);
  if (!output.includes(`${path.sep}.ui-audit${path.sep}private${path.sep}`)) {
    throw new Error('Candidates must remain under .ui-audit/private/ until reviewed');
  }
  if (fs.existsSync(output)) throw new Error('Refusing to overwrite an existing capture');
  await page.evaluate(() => document.fonts.ready);
  const handle = await page.evaluateHandle(replaceFields, rules);
  try {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const unchanged = await handle.evaluate(edits => edits.every(e => e.target.isConnected && e.target[e.property] === e.replacement));
    if (!unchanged) throw new Error('Page rerendered during sanitization; capture cancelled');
    const image = await page.screenshot({ fullPage: true, scale: 'css', animations: 'disabled', caret: 'hide' });
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await writeImage(image, output);
  } finally {
    await handle.evaluate(edits => {
      for (const e of edits) if (e.target.isConnected && e.target[e.property] === e.replacement) e.target[e.property] = e.original;
    });
    await handle.dispose();
  }
  return { filename: output, reviewed: false };
}
module.exports = { replaceFields, captureCandidate };
