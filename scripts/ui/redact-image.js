const sharp = require('sharp');
const { writeImage } = require('./images');
const escape = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));

// Opaque replacement, never blur. The manifest contains geometry and synthetic text only.
async function redactImage(input, output, manifest) {
  const meta = await sharp(input).metadata();
  if (manifest.version !== 1 || manifest.viewport.dpr !== 1 ||
      ![manifest.viewport.width, manifest.document.width].includes(meta.width) ||
      meta.height !== manifest.document.height || !manifest.masks.length) {
    throw new Error('Capture geometry is unverified; refusing to publish.');
  }
  const opaqueFill = value => /^rgb\(\d+, ?\d+, ?\d+\)$/.test(value) || /^#[a-f0-9]{6}$/i.test(value) ? value : '#f2f2f6';
  const boxes = manifest.masks.map((m, i) => {
    if (![m.x,m.y,m.width,m.height,m.fontSize].every(Number.isFinite)) throw new Error('Invalid mask geometry');
    const x = Math.max(0, Math.floor(m.x)-4), y = Math.max(0, Math.floor(m.y)-4);
    const width = Math.min(meta.width-x, Math.ceil(m.x+m.width)+4-x), height = Math.min(meta.height-y, Math.ceil(m.y+m.height)+4-y);
    if (width <= 0 || height <= 0) return '';
    const text = m.text.replace(/^Example /, 'Demo ').replace(/^person\d+@example\.com$/, 'user@example.com').replace(/^00000000-0000-4000-8000-000000000001$/, 'demo-id-001');
    const fontSize = Math.min(m.fontSize, Math.max(1, (width-8) / Math.max(1, text.length*.65)));
    return `<g><defs><clipPath id="m${i}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escape(opaqueFill(m.fill))}"/><text x="${x+4}" y="${y+4+Math.min(m.fontSize,height-4)}" font-family="Arial,sans-serif" font-size="${fontSize}" fill="${escape(m.color)}" clip-path="url(#m${i})">${escape(text)}</text></g>`;
  }).join('');
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}">${boxes}</svg>`);
  const pixels = await sharp(input).composite([{ input: overlay }]).png().toBuffer();
  await writeImage(pixels, output);
  return { width: meta.width, height: meta.height, masks: manifest.masks.length };
}
module.exports = { redactImage };
