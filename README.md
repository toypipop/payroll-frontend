# Payroll Frontend

React 19 + Vite frontend. It runs on `http://localhost:5174` and proxies `/api` to the backend.

## Setup

```powershell
Copy-Item .env.example .env
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

`.env` is ignored by Git. Copy `.env.example` after every fresh clone; never commit real credentials or environment values.
