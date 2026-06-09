/**
 * Driver for payroll-frontend — screenshot / interaction harness.
 * Usage: node .claude/skills/run-payroll-frontend/driver.mjs [command]
 *
 * Commands:
 *   ss <path>      Take screenshot (default: tmp/ss.png)
 *   login          Screenshot the login page
 *   open <url>     Navigate to URL and screenshot
 *
 * Requires: playwright installed (npm install --save-dev playwright)
 * Uses system Chrome if CHROME_PATH env is set, otherwise uses playwright's bundled chromium.
 */

import { chromium } from 'playwright';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../..');
const BASE_URL = process.env.APP_URL || 'http://localhost:5174';

// Common Chrome paths
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

function findChrome() {
  return CHROME_CANDIDATES.find(p => existsSync(p)) || null;
}

async function launch() {
  const executablePath = findChrome();
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
}

async function screenshot(url, outPath) {
  await mkdir(join(projectRoot, 'tmp'), { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  const finalUrl = page.url();
  const title = await page.title();
  const absPath = outPath.startsWith('/') || outPath.match(/^[A-Z]:/i)
    ? outPath
    : join(projectRoot, outPath);
  await page.screenshot({ path: absPath });
  await browser.close();
  return { url: finalUrl, title, path: absPath };
}

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === 'ss') {
  const out = args[0] || 'tmp/ss.png';
  const result = await screenshot(BASE_URL, out);
  console.log(`URL: ${result.url}\nTitle: ${result.title}\nScreenshot: ${result.path}`);
} else if (cmd === 'login') {
  const out = args[0] || 'tmp/ss-login.png';
  const result = await screenshot(`${BASE_URL}/login`, out);
  console.log(`URL: ${result.url}\nTitle: ${result.title}\nScreenshot: ${result.path}`);
} else if (cmd === 'open') {
  const url = args[0] ? (args[0].startsWith('http') ? args[0] : `${BASE_URL}${args[0]}`) : BASE_URL;
  const out = args[1] || 'tmp/ss-open.png';
  const result = await screenshot(url, out);
  console.log(`URL: ${result.url}\nTitle: ${result.title}\nScreenshot: ${result.path}`);
} else {
  console.error(`Unknown command: ${cmd}. Use: ss, login, open <path>`);
  process.exit(1);
}
