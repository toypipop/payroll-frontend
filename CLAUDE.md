# CLAUDE.md — Payroll System

## Scope: Both Frontend AND Backend

This agent manages **both** repos every session:

| | Frontend | Backend |
|---|---|---|
| Path | `payroll-frontend/` | `payroll-backend/` |
| Stack | React 19 + Vite + TypeScript | Go (Fiber/Gin) + GORM + PostgreSQL |
| Port | 5174 | 8000 |

**Before any task:** check whether changes are needed on both sides.
**For routes, modules, auth, permissions, seed data, or API contracts:** read `../payroll-backend/CLAUDE.md` first.

## Environment

- API base: `/api/v1`; frontend calls `/api/v1`, Vite/nginx proxies `/api` → backend.
- `.env` is local-only and gitignored; `.env.example` lists required keys only.
- UAT: frontend `http://5.223.87.23:5174`, API `http://5.223.87.23:8000/api/v1`.
- CORS default: `http://localhost:5174`; override with `CORS_ALLOWED_ORIGINS`.

## Auth

- Cookie-based JWT via httpOnly `auth_token` — never return JWTs in bodies, never use `Authorization` header.
- Login / check / logout: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- Store only: `id`, `fullName`, `roles`, `companies_id`, `accessible_company_ids`.

## Modules / Navigation

- `GET /api/v1/modules` is public and drives all frontend routes, sidebar, and breadcrumbs.
- Backend `ModuleKey` must match frontend page filename exactly (e.g. `EmployeesListPage`).
- Backend `Icon` must exist in `src/components/common/Sidebar.tsx`.
- **New page checklist:** backend seed module + route + permission → frontend page file + API calls + icon mapping.

## Critical API Contracts

- Company options: `GET /companies/options` (not `/companies`).
- Companies list: `GET /companies/all` (not `/companies`).
- Payroll categories: `/master/earning-categories`, `/master/deduction-categories`.
- Protected endpoints need `AuthMiddleware()` + `CheckPermission(...)`.

## Business Rules (Always Apply)

- `employees.companies_id` = home company for payroll, attendance, salary, department, position, employment type.
- `employee_company_access.company_id` = app access only, not payroll ownership.
- Employee-linked forms must cascade company → department/position/role/employment type/employee and reject mismatches.
- Time Logs: end <= start means overnight (e.g. `16:00` → `00:00` checks out next day).
- Leave Requests: only `Pending` status can be edited.

## Commands

**Frontend:**
```bash
npm install && npm run dev          # run
npm run typecheck && npm run lint   # required after edits
npm run build                       # verify build
npx vitest run                      # tests
```

**Backend:**
```bash
go run .                            # run
gofmt -w <files> && go vet ./...    # required after edits
go test ./...                       # tests
go run ./seed                       # reseed data
docker compose -f docker-compose.local.yml up -d   # local Docker
```
