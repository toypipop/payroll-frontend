# Payroll Frontend

React 19 + Vite 7 + TypeScript 6. Use Node.js 24 with npm (matching the Docker build).

Requires the backend at `http://localhost:8000` for login and dynamic pages.

## Install and run

```powershell
# Run from payroll-frontend. Copy the template only on first setup.
Copy-Item .env.local.example .env
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5174`. Keep `VITE_API_URL=/api/v1`; the local proxy target is set by `API_PROXY_TARGET`. Never commit `.env`.

## Other commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

On Linux/macOS, use `cp .env.local.example .env` and `npm` instead of `npm.cmd`.
