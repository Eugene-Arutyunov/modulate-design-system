// Field replacement for Compare captures. Everything here runs inside the capture page:
// private text is replaced in the DOM before the screenshot (via semantic-capture
// replaceFields), and a leftover check throws when anything private is still visible.
// Images are never masked, blurred or edited afterwards.

// Prototype fixtures that look like real people or companies, with the synthetic values used
// in every published refresh. Longer phrases first; a space also matches line breaks.
const PROTOTYPE_SUBSTITUTIONS = [
  ['Eugene’s Personal Organization', 'Northstar Research'],
  ["Eugene's Personal Organization", 'Northstar Research'],
  ['Eugene Arutyunov', 'Alex Morgan'],
  ['e@intuition.team', 'alex.morgan@example.com'],
  ['xneeson@ya.ru', 'robin.taylor@example.com'],
  ['Sinelnikov Corp.', 'Cedar Analytics'],
  ['Sinelnikov Corp', 'Cedar Analytics'],
  ['Ilya Sinelnikov', 'Jamie Parker'],
  // PII-demo transcript.
  ['daniel.mercer82@protonmail.com', 'jordan.parker92@example.com'],
  ['Daniel Andrew Mercer', 'Jordan Lee Parker'],
  ['Daniel Andrew', 'Jordan Lee'],
  ['Daniel Mercer', 'Jordan Parker'],
  ['Mercer', 'Parker'],
  ['Green Valley Health', 'Cedar Valley Health'],
  ['Green Valley', 'Cedar Valley'],
  ['4827 Willow Creek Drive, Apt 5B', '5200 Example Grove Drive, Apt 2A'],
  ['Willow Creek Drive', 'Example Grove Drive'],
  ['Willow Creek', 'Example Grove'],
  ['Apt 5B', 'Apt 2A'],
  ['born July 18, 1982', 'born March 4, 1987'],
  ['July 18, 1982', 'March 4, 1987'],
  ['GVH-88394127', 'CVH-40517263'],
  ['614-555-0198', '212-555-0147'],
  ['380-555-4412', '312-555-0175'],
  ['555-0198', '555-0147'],
  ['555-4412', '555-0175'],
  ['Harrison Industrial Company', 'Summit Fabrication Company'],
  ['Harrison', 'Summit'],
  ['2150 Fisher Road', '800 Example Road'],
  ['Fisher Road', 'Example Road'],
];
const PROTOTYPE_WORDS = [['EA', 'AM'], ['Mina', 'Casey'], ['4827', '5200'], ['4421', '7310'], ['1982', '1987'], ['2150', '800']];
// Anything matching this after replacement blocks the prototype capture.
const PROTOTYPE_FORBIDDEN = 'Arutyunov|Eugene|intuition\\.team|xneeson|ya\\.ru|Sinelnikov|Ilya|Mercer|protonmail|Willow|Green Valley|GVH-|Harrison|Fisher Road|\\bMina\\b|\\bEA\\b|\\b4421\\b|614-555|380-555|555-0198|555-4412';

/** In page: rules for prototype fixtures. Throws if a forbidden value would stay visible. */
function prototypeRules({ substitutions, words, forbidden }) {
  const re = new RegExp(forbidden);
  const apply = s => {
    let out = s;
    for (const [a, b] of substitutions) out = out.replace(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'), 'g'), b);
    for (const [a, b] of words) out = out.replace(new RegExp(`\\b${a}\\b`, 'g'), b);
    return out;
  };
  const pathOf = el => {
    const parts = [];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...e.parentElement.children].indexOf(e) + 1})`);
    return 'html > ' + parts.join(' > ');
  };
  const rules = new Map(), leftovers = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style,noscript')) continue;
    const text = node.textContent, next = apply(text);
    if (re.test(next)) leftovers.push(text.slice(0, 80));
    if (next !== text) { const selector = pathOf(node.parentElement); rules.set(selector + '\u0000' + text, { selector, contains: text, text: next }); }
  }
  for (const input of document.querySelectorAll('input,textarea')) {
    const next = apply(input.value);
    if (re.test(next)) leftovers.push('[value] ' + input.value.slice(0, 80));
    if (next !== input.value) rules.set(pathOf(input), { selector: pathOf(input), text: next });
  }
  for (const el of document.querySelectorAll('[placeholder]')) if (re.test(el.getAttribute('placeholder')) && el.getClientRects().length) leftovers.push('[placeholder] ' + el.getAttribute('placeholder').slice(0, 80));
  if (leftovers.length) throw new Error('Unhandled private values: ' + [...new Set(leftovers)].join(' | ') + ' — add them to PROTOTYPE_SUBSTITUTIONS in scripts/ui/anonymize.js');
  return { rules: [...rules.values()], originals: [] };
}

/**
 * In page: rules for production. Replaces table columns by header, every non-example email,
 * IP addresses, the signed-in user's name, the organization name, key names and timestamps
 * on the user's own pages (credit amounts are not sensitive and stay unchanged), then checks the captured
 * area for anything left. Returns { rules, originals, stopwords } for the canvas check.
 */
function productionRules({ scopeSel, stoplist }) {
  const hash = v => [...v].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const NAMES = ['Alex Morgan', 'Jamie Parker', 'Robin Taylor', 'Casey Jordan', 'Morgan Lee', 'Taylor Brooks', 'Jordan Reyes', 'Riley Chen', 'Avery Quinn', 'Sam Patel'];
  const ORGS = ['Northstar Labs', 'Cedar Analytics', 'Harbor Studio', 'Summit Research', 'Maple Systems', 'Bluewater Health', 'Atlas Media', 'Lumen Retail', 'Granite Works', 'Orchid Voice', 'Pinecrest Group', 'Redwood Support', 'Silverline Care', 'Tidewater Labs', 'Beacon Contact', 'Juniper Health', 'Kestrel Audio', 'Meridian Calls', 'Nimbus Retail', 'Oakridge Media', 'Quartz Systems', 'Riverbend Clinic', 'Sable Studio', 'Willow Tech'];
  const KEEP_TAGS = new Set(['Partner', 'Internal', 'Test', 'Demo', 'E2E', 'Pilot', 'Enterprise', 'Trial', '-', '—']);
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // The signed-in user: shown as Jamie Parker everywhere, including their own email address.
  const me = (document.querySelector('header span.max-w-40.truncate')?.textContent || '').trim();
  const meWords = me.split(/\s+/).filter(w => w.length >= 3);
  const initials = me.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase();
  const stopwords = [...new Set([...meWords, ...stoplist])];
  const stopRe = stopwords.length ? new RegExp(`\\b(${stopwords.map(escape).join('|')})\\b`, 'i') : null;

  const name = v => NAMES[hash(v.trim().toLowerCase()) % NAMES.length];
  const orgMap = new Map(); // distinct organizations get distinct names, in order of appearance
  const org = v => { const k = v.trim().toLowerCase(); if (!orgMap.has(k)) { const i = orgMap.size; orgMap.set(k, ORGS[i % ORGS.length] + (i >= ORGS.length ? ' II' : '')); } return orgMap.get(k); };
  const isMine = v => meWords.some(w => v.toLowerCase().split('@')[0].includes(w.toLowerCase()));
  const email = v => isMine(v) ? 'jamie.parker@example.com' : `${name(v).toLowerCase().replace(' ', '.')}@example.com`;
  const code = v => { const n = hash(v); let i = 0; return v.replace(/[a-z0-9]/gi, c => { const k = (n + ++i * 7) % 16; if (/\d/.test(c)) return String(k % 10); const hex = /[a-f]/i.test(c) && /^[0-9a-f.\-_]+$/i.test(v); const ch = hex ? 'abcdef'[k % 6] : String.fromCharCode(97 + (n + i * 11) % 26); return c === c.toUpperCase() && !hex ? ch.toUpperCase() : ch; }); };
  // Valid, descending synthetic timestamps in the production format (M/D/YYYY, h:mm:ss AM/PM).
  // Two production formats: 9/29/2026, 4:12:05 PM (tables) and 29 Sept 2026, 16:12 (Overview).
  const DATE = /^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M$/;
  const SHORT_DATE = /^\d{1,2} [A-Z][a-z]{2,3} \d{4}, \d{2}:\d{2}$/;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const fmtShort = d => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  const fmt = d => { let h = d.getUTCHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; const p = n => String(n).padStart(2, '0'); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}, ${h}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} ${ap}`; };
  const rowTime = i => Date.UTC(2026, 8, 29, 16, 12, 5) - i * 137 * 60000 - ((i * 7919) % 3000) * 1000;
  const date = (column, row, short) => (short ? fmtShort : fmt)(new Date(rowTime(row) + (column === 'Completed' ? 30000 + (row % 3) * 1000 : 0)));
  const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  const IP = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;

  const edits = new Map(), originals = new Set(), produced = new Set();
  const set = (node, text) => { if (text !== node.textContent) { edits.set(node, text); const t = node.textContent.trim(); if (t.length >= 3) originals.add(t); } };
  const cur = node => edits.has(node) ? edits.get(node) : node.textContent;
  const textNodes = el => { const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (w.currentNode.textContent.trim() && !w.currentNode.parentElement.closest('script,style,noscript')) out.push(w.currentNode); return out; };
  const scope = scopeSel ? document.querySelector(scopeSel) : document.body;
  if (!scope) throw new Error(`Capture scope not found: ${scopeSel}`);

  // Table columns by header name.
  const KIND = { 'User': 'identity', 'Recipient': 'identity', 'Initiated By': 'identity', 'Created By': 'identity', 'Email': 'identity', 'UUID': 'code', 'SES Message ID': 'code', 'Code': 'code', 'Link': 'code', 'Organization': 'org', 'Tags': 'tag' };
  // The user's own dashboard pages. Credit balances and amounts are not sensitive (user decision)
  // and stay unchanged, so they match the charts; key names and timestamps are replaced.
  if (location.pathname.startsWith('/dashboard/')) Object.assign(KIND, { 'API Key': 'keyName', 'Date': 'date', 'Submitted': 'date', 'Completed': 'date' });
  for (const table of document.querySelectorAll('main table')) {
    const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
    [...table.querySelectorAll('tbody tr')].forEach((tr, row) => {
      [...tr.children].forEach((td, i) => {
        let kind = KIND[heads[i]];
        if (heads[i] === 'Name') kind = location.pathname.startsWith('/dashboard/api-keys') ? 'keyName' : location.pathname === '/internal/usage' ? 'org' : null;
        if (heads[i] === 'Members' && location.pathname === '/internal/usage') kind = 'identity-list';
        if (!kind) return;
        for (const n of textNodes(td)) {
          const t = n.textContent, s = t.trim();
          if (!/[\p{L}\p{N}]/u.test(s)) continue;
          if (kind === 'keyName' && n.parentElement.closest('.m-0, [class*="text-muted"]')) continue;
          if (kind === 'identity-list') set(n, t.split(/(,\s*)/).map(part => /^,\s*$/.test(part) || !part.trim() ? part : part.includes('@') ? part.replace(EMAIL, email) : part.replace(part.trim(), name(part.trim()))).join(''));
          else if (kind === 'identity') set(n, t.replace(s, s.includes('@') ? s.replace(EMAIL, email) : name(s)));
          else if (kind === 'code') set(n, t.replace(s, code(s)));
          else if (kind === 'org') set(n, t.replace(s, s.includes('@') ? s.replace(EMAIL, email) : s.split(/,\s*/).map(p => p === 'Personal' ? p : org(p)).join(', ')));
          else if (kind === 'tag') set(n, KEEP_TAGS.has(s) ? t : t.replace(s, org(s)));
          else if (kind === 'keyName' && (heads[i] === 'API Key' || n.parentElement.matches('div.font-medium'))) set(n, t.replace(s, ['Development', 'Staging service', 'Production service', 'Integration tests'][hash(s) % 4]));
          else if (kind === 'date' && (DATE.test(s) || SHORT_DATE.test(s))) set(n, t.replace(s, date(heads[i], row, SHORT_DATE.test(s))));
        }
      });
    });
  }
  // Everything else on the page.
  for (const n of textNodes(document.body)) {
    let t = cur(n);
    const p = n.parentElement;
    if (me && t.includes(me)) t = t.split(me).join('Jamie Parker');
    if (initials.length >= 2 && t.trim() === initials) t = t.replace(initials, 'JP');
    t = t.replace(EMAIL, m => /@example\.com$/.test(m) ? m : email(m));
    t = t.replace(IP, m => { const h = hash(m); const ip = `10.${h % 200 + 20}.${(h >>> 8) % 250}.${(h >>> 16) % 250 + 2}`; produced.add(ip); return ip; });
    // The organization name outside the logo, links and legal footer (the account menu included).
    if ((!p.closest('a, footer') || p.closest('[role=menu]')) && /^\s*Modulate(,|\s*$)/.test(t)) t = t.replace('Modulate', 'Demo Organization');
    set(n, t);
  }
  const pathOf = el => { const parts = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...e.parentElement.children].indexOf(e) + 1})`); return 'html > ' + parts.join(' > '); };
  const inputRules = [];
  for (const i of document.querySelectorAll('input,textarea')) {
    if (!i.value || !i.getClientRects().length) continue;
    let v = i.value;
    if ((me && v.includes(me)) || (stopRe && stopRe.test(v))) v = 'Jamie Parker';
    v = v.replace(EMAIL, m => /@example\.com$/.test(m) ? m : email(m));
    if (v !== i.value) { originals.add(i.value); inputRules.push({ selector: pathOf(i), text: v }); }
  }

  // Leftover check inside the captured area.
  const after = textNodes(scope).map(cur).join('\n');
  const bad = [];
  for (const m of after.match(EMAIL) || []) if (!/@example\.com$/.test(m)) bad.push(m);
  for (const m of after.match(IP) || []) if (!produced.has(m)) bad.push('IP ' + m);
  for (const o of originals) if (o.length >= 4 && after.includes(o) && !/^(Personal|Modulate)$/.test(o)) bad.push('original ' + o.slice(0, 30));
  if (stopRe && stopRe.test(after)) bad.push('name ' + after.match(stopRe)[0]);
  if (bad.length) throw new Error('Unhandled private values: ' + [...new Set(bad)].slice(0, 8).join(' | ') + ' — extend productionRules in scripts/ui/anonymize.js');

  const rules = new Map();
  for (const [node, text] of edits) {
    const selector = pathOf(node.parentElement), key = selector + '\u0000' + node.textContent;
    if (rules.has(key)) { if (rules.get(key).text !== text) throw new Error('Conflicting duplicate node text'); continue; }
    rules.set(key, { selector, contains: node.textContent, text });
  }
  for (const r of inputRules) rules.set(r.selector, r);
  return { rules: [...rules.values()], originals: [...originals], stopwords };
}

/**
 * In page: UUID colour dots encode UUID characters as bg-uuid-<hex> classes. Re-derive them
 * from the (already replaced) synthetic UUID text. Returns the edits for restoring.
 */
function rederiveUuidDots() {
  const edits = [];
  for (const el of document.querySelectorAll('span.group\\/uuid')) {
    const text = (el.querySelector('.font-semi-mono')?.firstChild?.textContent || '').replace(/[^0-9a-f]/gi, '').toLowerCase();
    const spans = [...el.querySelectorAll('[class*="bg-uuid-"]')];
    if (!text || !spans.length) continue;
    spans.forEach((s, i) => {
      const before = s.className, next = before.replace(/\bbg-uuid-[0-9a-f]\b/, `bg-uuid-${text[i % text.length]}`);
      if (next !== before) { s.className = next; edits.push({ s, before, next }); }
    });
  }
  return edits;
}

/** Init script: records every string drawn on a canvas, so chart labels can be checked. */
function recordCanvasText() {
  window.__uiCanvasText = new Set();
  const P = CanvasRenderingContext2D.prototype;
  for (const method of ['fillText', 'strokeText']) {
    const original = P[method];
    P[method] = function (text, ...rest) { window.__uiCanvasText.add(String(text)); return original.call(this, text, ...rest); };
  }
}

/** Node: chart labels must not contain emails, IP addresses, replaced values or private words. */
function checkCanvasText(drawn, { originals = [], stopwords = [] }) {
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stopRe = stopwords.length ? new RegExp(`\\b(${stopwords.map(escape).join('|')})\\b`, 'i') : null;
  const long = originals.filter(o => o.length >= 4 && !/^(Personal|Modulate)$/.test(o));
  const bad = drawn.filter(t => /@[\w-]+\.[\w.-]+/.test(t) || /\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(t) || (stopRe && stopRe.test(t)) || long.some(o => t.includes(o)));
  if (bad.length) throw new Error(`Chart labels contain private values (${bad.length}); charts cannot be edited in the page, so this state needs a manual decision`);
}

module.exports = { PROTOTYPE_SUBSTITUTIONS, PROTOTYPE_WORDS, PROTOTYPE_FORBIDDEN, prototypeRules, productionRules, rederiveUuidDots, recordCanvasText, checkCanvasText };
