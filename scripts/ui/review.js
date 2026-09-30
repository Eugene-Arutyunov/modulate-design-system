// Local review page for a refresh run: current published image next to each new candidate,
// with checkboxes and a Publish button. Listens on 127.0.0.1 only.
//   npm run ui:review        reopen the latest run
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { publish, latestRun, itemKey } = require('./publish');

const root = path.resolve(__dirname, '../..');
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

function page(run, token) {
  const published = JSON.parse(fs.readFileSync(path.join(root, 'ui-public/results.json'), 'utf8')).checks;
  const rows = run.items.map(item => {
    const key = itemKey(item);
    const current = published.find(c => c.pageId === item.id && c.scenario === item.scenario)?.screenshots?.[item.side];
    const status = item.error ? `<p class="error">Not captured: ${esc(item.error)}</p>` : item.published ? '<p class="done">Published</p>'
      : `<label class="approve"><input type="checkbox" name="approve" value="${esc(key)}"> Approve</label>`;
    return `<section id="${esc(key)}">
      <h2>${esc(item.title)} <small>${esc(item.side)}${item.scenario === 'default' ? '' : ` · ${esc(item.scenario)}`} · ${esc(item.reason)}${item.width ? ` · ${item.width}×${item.height}` : ''}</small></h2>
      ${status}
      <div class="pair">
        <figure><figcaption>Now in Compare</figcaption>${current ? `<a href="/current/${esc(path.basename(current))}" target="_blank"><img loading="lazy" src="/current/${esc(path.basename(current))}"></a>` : '<p class="none">—</p>'}</figure>
        <figure><figcaption>New capture</figcaption>${item.file ? `<a href="/run/${esc(item.file)}" target="_blank"><img loading="lazy" src="/run/${esc(item.file)}"></a>` : '<p class="none">—</p>'}</figure>
      </div>
    </section>`;
  }).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Compare review</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1d1d24;--muted:#6b6b7b;--line:#e4e4ea;--accent:#3b5bdb;--err:#c92a2a;--ok:#2b8a3e}
@media (prefers-color-scheme:dark){:root{--bg:#141418;--fg:#ececf1;--muted:#9a9aab;--line:#2c2c35;--accent:#748ffc;--err:#ff8787;--ok:#69db7c}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}
header{position:sticky;top:0;z-index:1;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
header h1{font-size:16px;margin:0 auto 0 0}
button{font:inherit;padding:6px 14px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--fg);cursor:pointer}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
main{padding:0 16px 48px;max-width:1500px;margin:0 auto}
section{border-bottom:1px solid var(--line);padding:16px 0}
h2{font-size:15px;margin:0 0 6px}h2 small{color:var(--muted);font-weight:400}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media (max-width:700px){.pair{grid-template-columns:1fr}}
figure{margin:0}figcaption{color:var(--muted);font-size:12px;margin-bottom:4px}
img{width:100%;max-height:560px;object-fit:cover;object-position:top;border:1px solid var(--line);border-radius:6px;background:#fff}
.error{color:var(--err);margin:4px 0}.done{color:var(--ok);margin:4px 0}.none{color:var(--muted)}
.approve{display:inline-flex;gap:6px;align-items:center;margin:4px 0 8px;font-weight:600}
#result{white-space:pre-wrap}
</style></head><body>
<header><h1>Compare review · ${esc(run.stamp)}</h1>
<span>Open each image in full before approving: names, emails, IDs, charts, cut-off text.</span>
<button type="button" id="all">Select all</button><button type="button" class="primary" id="publish">Publish selected</button></header>
<main><p id="result"></p>${rows}</main>
<script>
const boxes = () => [...document.querySelectorAll('input[name=approve]')];
document.getElementById('all').onclick = () => { const on = boxes().some(b => !b.checked); boxes().forEach(b => b.checked = on); };
document.getElementById('publish').onclick = async () => {
  const approve = boxes().filter(b => b.checked).map(b => b.value);
  if (!approve.length) return alert('Select at least one image.');
  const res = await fetch('/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': ${JSON.stringify(token)} }, body: JSON.stringify({ approve }) });
  const out = document.getElementById('result'); out.textContent = await res.text(); out.className = res.ok ? 'done' : 'error';
  if (res.ok) setTimeout(() => location.reload(), 1500); else scrollTo(0, 0);
};
</script></body></html>`;
}

function startReview(runDir, { port = Number(process.env.UI_REVIEW_PORT) || 4612, open = true } = {}) {
  const token = crypto.randomBytes(16).toString('hex');
  const readRun = () => JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  const sendFile = (res, base, name) => {
    const file = path.join(base, path.basename(name));
    if (!/\.webp$/.test(file) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(page(readRun(), token)); }
      if (req.method === 'GET' && url.pathname.startsWith('/run/')) return sendFile(res, runDir, decodeURIComponent(url.pathname.slice(5)));
      if (req.method === 'GET' && url.pathname.startsWith('/current/')) return sendFile(res, path.join(root, 'ui-public'), decodeURIComponent(url.pathname.slice(9)));
      if (req.method === 'POST' && url.pathname === '/publish') {
        if (req.headers['x-review-token'] !== token) { res.writeHead(403); return res.end('Forbidden'); }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const result = publish(root, runDir, JSON.parse(body).approve);
            const text = `Published ${result.published.length} image(s), removed ${result.removed} superseded.` +
              (result.notesToCheck.length ? `\nCheck that the difference notes still match: ${result.notesToCheck.join(', ')}.` : '') +
              '\nNext: npm run test:ui, look at /ui/compare/, then commit ui-public/ and src/includes/service/ui-updated.html.';
            console.log(text);
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(text);
          } catch (error) { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(error.message); }
        });
        return;
      }
      res.writeHead(404); res.end();
    } catch (error) { res.writeHead(500); res.end(error.message); }
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = `http://127.0.0.1:${port}/`;
      console.log(`Review: ${address}  (Ctrl+C to stop)`);
      if (open && process.platform === 'darwin') spawn('open', [address], { stdio: 'ignore', detached: true }).unref();
      resolve(server);
    });
  });
}

if (require.main === module) {
  const arg = process.argv.slice(2).find(a => a.startsWith('--run='));
  const runDir = arg ? path.resolve(root, arg.slice(6)) : latestRun(path.join(root, '.ui-audit/private/runs'));
  startReview(runDir, { open: !process.argv.includes('--no-open') }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { startReview };
