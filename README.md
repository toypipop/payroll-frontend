# Payroll Frontend

React + Vite app at `http://localhost:5174`.

## Install and run

```powershell
Copy-Item .env.local.example .env
npm install
npm run dev
```

Keep `VITE_API_URL=/api/v1` in `.env`. Never commit `.env`.

## Visible browser tests

Start the backend and `npm run dev`, then run a headed Playwright case:

```powershell
npm run test:browser:password
```

Tests only allow a local URL and use the mock admin by default. Override it with `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` when needed.
