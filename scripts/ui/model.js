const crypto = require('node:crypto');

const digest = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const paths = route => (route?.routes || [route?.route]).filter(value => typeof value === 'string' && value.startsWith('/'));
function checkStatus(check, fingerprint) {
  if (!check) return 'not-checked';
  if (check.fingerprint !== fingerprint) return 'stale';
  if (check.status === 'blocked' || check.status === 'error') return check.status;
  return ['match', 'differences', 'prototype-only', 'production-only'].includes(check.status) ? check.status : 'error';
}
function assertScheme(raw) {
  for (const side of ['current', 'target']) {
    if (!Array.isArray(raw?.[side])) throw new Error(`ui.yaml: ${side} must be an array`);
    const ids = new Set();
    for (const route of raw[side]) {
      if (!route.id || !/^[a-z0-9-]+$/.test(route.id) || ids.has(route.id)) throw new Error(`ui.yaml: missing, invalid or duplicate ${side} id ${route.id}`);
      ids.add(route.id);
      const names = new Set();
      for (const scenario of route.audit?.scenarios || []) {
        if (!scenario.name || names.has(scenario.name)) throw new Error(`Invalid or duplicate audit state for ${route.id}`);
        names.add(scenario.name);
      }
      for (const region of route.audit?.regions || []) {
        if (!/^[a-z0-9-]+$/.test(region.id)) throw new Error(`Invalid region id for ${route.id}`);
      }
    }
  }
  return raw;
}
module.exports = { digest, paths, checkStatus, assertScheme };
