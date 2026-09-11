const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { isPublicCapture, publicChecks } = require('./public-captures');
const root = path.resolve(__dirname, '../..');
const port = Number(process.env.UI_AUDIT_PORT || 4611);
function fileFor(base, requestPath) {
  const file = path.resolve(base, `.${requestPath}`);
  return file === base || file.startsWith(base + path.sep) ? file : null;
}
function auditMiddleware(req, res, next) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname !== '/ui-audit-data.json' && !pathname.startsWith('/ui-audit/')) return next();
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  try {
    if (pathname === '/ui-audit-data.json') {
      const file = path.join(root, '.ui-audit/latest/results.json');
      const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { checks: [] };
      data.checks = publicChecks(data.checks || [], path.join(root, '.ui-audit/latest'));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(req.method === 'HEAD' ? '' : JSON.stringify({ checks: data.checks }));
    }
    const base = path.join(root, '.ui-audit/latest');
    const file = fileFor(base, decodeURIComponent(pathname.slice('/ui-audit'.length)));
    if (!file || !/\.(png|webp)$/i.test(file) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.realpathSync(file).startsWith(fs.realpathSync(base) + path.sep)) {
      res.writeHead(404); return res.end('Not found');
    }
    if (!isPublicCapture(path.dirname(file), path.basename(file))) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': path.extname(file).toLowerCase() === '.webp' ? 'image/webp' : 'image/png', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end('Unable to read comparison files.'); }
}
const server = http.createServer((req, res) => auditMiddleware(req, res, () => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = fileFor(path.join(root, '_site'), pathname);
    if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
    const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end('Unable to read the built page.'); }
}));
if (require.main === module) server.listen(port, '127.0.0.1', () => console.log(`UI Scheme: http://127.0.0.1:${port}/ui/`));
module.exports = { fileFor, auditMiddleware };
