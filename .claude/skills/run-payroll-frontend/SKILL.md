---
name: run-payroll-frontend
description: Run, start, build, screenshot, or test the payroll-frontend React/Vite app. Use when asked to launch the app, take a screenshot, verify a UI change, or check the running frontend.
---

Payroll Pro is a React 19 + Vite SPA. Dev server runs on **port 5174**. The driver at `.claude/skills/run-payroll-frontend/driver.mjs` starts a headless Playwright session against the running server and takes screenshots. It auto-detects system Chrome; no browser install needed if Chrome is present.

## Prerequisites

```bash
# Node 18+ required
node --version

# Install deps (playwright included as devDependency)
npm install
```

On Linux without system Chrome, install Chromium:
```bash
apt-get install -y chromium-browser
# or: npx playwright install chromium
```

## Build

```bash
npm run build   # TypeScript check + Vite bundle → dist/
```

## Run (agent path)

**Step 1 — start the dev server** (keep running in background):
```bash
npm run dev
# Listens on http://localhost:5174
# API proxy → http://localhost:8001 (set API_PROXY_TARGET in .env to change)
```

**Step 2 — drive it with the driver**:
```bash
# Screenshot whatever page loads (redirects to /login if no session)
node .claude/skills/run-payroll-frontend/driver.mjs ss tmp/out.png

# Screenshot the login page specifically
node .claude/skills/run-payroll-frontend/driver.mjs login tmp/login.png

# Navigate to any path and screenshot
node .claude/skills/run-payroll-frontend/driver.mjs open /dashboard tmp/dashboard.png
```

Driver output: `URL: <final-url>\nTitle: <page-title>\nScreenshot: <abs-path>`

Screenshots land in `tmp/` (gitignored). Read the file path from driver output with the `Read` tool to view the image.

Override the base URL:
```bash
APP_URL=http://localhost:5174 node .claude/skills/run-payroll-frontend/driver.mjs ss
```

## Run (human path)

```bash
npm run dev
# Opens http://localhost:5174 in browser
# Ctrl-C to stop
```

## Tests

```bash
npm run typecheck   # TypeScript only
```

## Environment

`.env` controls two vars:
```
VITE_API_URL=/api/v1          # prefix for all API calls (baked into the bundle)
API_PROXY_TARGET=http://localhost:8001  # Vite dev proxy target (dev only)
```

Without a running backend at `API_PROXY_TARGET`, the app loads but shows login; `/auth/me` and `/modules` fail with network errors (expected).

## Gotchas

- **`waitUntil: 'networkidle'` hangs** — Vite's HMR websocket keeps the connection open indefinitely. Use `domcontentloaded` + a `waitForTimeout(1500)` settle delay instead.
- **`networkidle` timeout** — same cause; driver already uses `domcontentloaded`.
- **App returns blank on first load** — `App.tsx` renders `null` while `loading || authLoading`. The 1500 ms settle wait covers this; increase `waitForTimeout` if pages still appear blank.
- **Routes are dynamic** — protected routes beyond `/dashboard` are fetched from `/modules` API at runtime. Without a backend they won't register; only `/login` and `/dashboard` are static routes.
- **Port 5174 not 5173** — `vite.config.js` pins `server.port: 5174`; don't assume the Vite default.

## Troubleshooting

**`ERR_CONNECTION_REFUSED`** — dev server isn't running. Run `npm run dev` first.

**`Cannot find module 'playwright'`** — run `npm install` from the project root.

**Blank screenshot / empty page** — increase `waitForTimeout` in the driver from 1500 to 3000 ms.

**Chrome not found** — set `CHROME_PATH=/path/to/chrome` or install via `npx playwright install chromium`.
