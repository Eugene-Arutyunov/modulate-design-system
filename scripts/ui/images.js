const fs = require('node:fs');
const sharp = require('sharp');

async function readImage(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

async function writeImage(input, filename) {
  const image = sharp(input);
  // Exact lossless encoding keeps screenshot and diff pixels unchanged, including transparency.
  const buffer = await (filename.endsWith('.webp')
    ? image.webp({ lossless: true, exact: true, effort: 6 })
    : image.png()).toBuffer();
  fs.writeFileSync(`${filename}.tmp`, buffer);
  fs.renameSync(`${filename}.tmp`, filename);
}

module.exports = { readImage, writeImage };
