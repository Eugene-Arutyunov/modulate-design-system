// Production sign-in for UI captures. The session lives outside the repository, readable
// only by the current user, and is reused until production expires it.
//   npm run ui:login    sign in (opens a browser window)
//   npm run ui:logout   delete the saved session
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PRODUCTION = 'https://platform.modulate.ai';
const home = process.env.UI_AUDIT_HOME || (process.platform === 'darwin'
  ? path.join(os.homedir(), 'Library/Application Support/modulate-ui-audit')
  : path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local/state'), 'modulate-ui-audit'));
const sessionFile = path.join(home, 'session.json');
// Optional local list of extra private words (one per line) that must never appear in a capture.
const stoplistFile = path.join(home, 'stoplist.txt');

function readStoplist() {
  return fs.existsSync(stoplistFile)
    ? fs.readFileSync(stoplistFile, 'utf8').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
    : [];
}

const onSignin = page => /\/(signin|login|auth)(\/|\?|$)/i.test(new URL(page.url()).pathname);

/** True when the saved session still opens the dashboard (read-only check). */
async function sessionIsValid(browser) {
  if (!fs.existsSync(sessionFile)) return false;
  const context = await browser.newContext({ storageState: sessionFile });
  try {
    await context.route('**/*', r => ['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.abort('blockedbyclient'));
    const page = await context.newPage();
    await page.goto(`${PRODUCTION}/dashboard/overview`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    if (onSignin(page)) return false;
    return await page.locator('header').first().isVisible().catch(() => false);
  } catch { return false; } finally { await context.close(); }
}

/** Opens a visible browser window, waits for the user to sign in, then saves the session. */
async function login(chromium) {
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${PRODUCTION}/dashboard/overview`);
    console.log('Sign in to Modulate in the opened browser window (waiting up to 15 minutes)…');
    await page.waitForFunction(() => {
      const visible = el => el.getClientRects().length;
      return location.pathname.startsWith('/dashboard/') &&
        [...document.querySelectorAll('a')].some(a => /\/dashboard\/api-keys\/?$/.test(new URL(a.href).pathname) && visible(a)) &&
        ![...document.querySelectorAll('button,a')].some(el => /^(sign in|log in)$/i.test(el.textContent.trim()) && visible(el));
    }, null, { timeout: 15 * 60 * 1000, polling: 1000 });
    fs.mkdirSync(home, { recursive: true, mode: 0o700 });
    fs.chmodSync(home, 0o700);
    const state = await context.storageState();
    fs.writeFileSync(`${sessionFile}.tmp`, JSON.stringify(state), { mode: 0o600 });
    fs.renameSync(`${sessionFile}.tmp`, sessionFile);
    console.log(`Signed in. Session saved to ${sessionFile}`);
  } finally { await browser.close(); }
}

/** Returns a valid session file, signing in first when needed (unless interactive login is disabled). */
async function ensureSession(chromium, browser, { interactive = true } = {}) {
  if (await sessionIsValid(browser)) return sessionFile;
  if (!interactive) throw new Error('No valid production session. Run `npm run ui:login` and sign in, then try again.');
  await login(chromium);
  if (!await sessionIsValid(browser)) throw new Error('Sign-in did not produce a working session.');
  return sessionFile;
}

function logout() {
  if (fs.existsSync(sessionFile)) fs.rmSync(sessionFile);
  console.log('Production session deleted.');
}

if (require.main === module) {
  if (process.argv[2] === 'logout') logout();
  else login(require('@playwright/test').chromium).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { PRODUCTION, home, sessionFile, readStoplist, sessionIsValid, ensureSession, login, logout };
