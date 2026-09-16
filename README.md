# Payroll Frontend

React 19 + Vite frontend. It runs on `http://localhost:5174` and proxies `/api` to the backend.

## Setup

```powershell
Copy-Item .env.local.example .env
npm install
npm run dev
```

Keep `VITE_API_URL=/api/v1`. Change `API_PROXY_TARGET` only when the backend is not at `http://localhost:8000`.

## Check

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`.env` is ignored by Git. Copy `.env.local.example` for local work, or `.env.uat.example` when running Vite against UAT; never commit real credentials or environment values. Docker-based UAT uses `/api/v1` behind nginx and receives deployment configuration separately.
