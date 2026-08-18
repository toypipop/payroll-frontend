# CLAUDE.md — Payroll System

## Scope: Both Frontend AND Backend

This agent manages **both** repos every session:

| | Frontend | Backend |
|---|---|---|
| Path | `payroll-frontend/` | `payroll-backend/` |
| Stack | React 19 + Vite + TypeScript | Go (Fiber/Gin) + GORM + PostgreSQL |
| Port | 5174 | 8000 |

**Before any task:** read `../payroll-backend/CLAUDE.md` first, then check whether changes are needed on both sides.

## Environment

- API base: `/api/v1`; frontend calls `/api/v1`, Vite/nginx proxies `/api` → backend.
- `.env` is local-only and gitignored; `.env.example` lists required keys only.
- CORS default: `http://localhost:5174`; override with `CORS_ALLOWED_ORIGINS`.

## Auth

- Cookie-based JWT via httpOnly `auth_token` — never return JWTs in bodies, never use `Authorization` header.
- Login / check / logout: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- The signed-in user lives in `AuthProvider` (`src/contexts/AuthContext.tsx`), fed once by `App.tsx` from `GET /auth/me`. Read it with `useAuth()` (`src/hooks/useAuth.ts`), which returns `user` and `homeCompanyId` (the string a company `SelectField` defaults to).
- **Nothing writes or reads `localStorage`.** Pages used to parse a `user` key at module load, which froze the value for the whole session; a page that needs the user calls `useAuth()` inside the component instead. Login just navigates to `/dashboard` — the full page load re-runs `/auth/me`, which is the only source of the user.
- The user carries only: `id`, `fullName`, `roles`, `companies_id`, `accessible_company_ids`.

## Modules / Navigation

- `GET /api/v1/modules` is public and drives all frontend routes, sidebar, and breadcrumbs.
- Backend `ModuleKey` must match frontend page filename exactly (e.g. `EmployeesListPage`).
- Backend `Icon` must exist in `src/components/common/Sidebar.tsx`.
- **New page checklist:** backend seed module + route + permission + an entry in `models/module_capability.go` (the server refuses to boot without one) → frontend page file + API calls + icon mapping.
- **Dashboard and My Payslips are not modules.** Their routes are hardcoded in `App.tsx` and their sidebar links in `Sidebar.tsx`, so every signed-in user gets both — `"/"` redirects to `/dashboard`. Do not add them back to the module tree; a permission row there only hides the sidebar link while the page stays reachable. The Dashboard's numbers are governed by the modules it reads from, and it uses `Promise.allSettled` so a 403 on one source does not blank the others.
- Each module on `/modules` carries `scope_level`, `allowed_actions`, `allowed_scopes`, `actions_atomic` — what the backend can actually enforce. `PermissionSettings.tsx` is driven entirely by these; it must not keep its own hardcoded module lists, which is how the matrix previously offered Data Scope values the server silently ignored.

## Critical API Contracts

- Company options: `GET /companies/options` (not `/companies`).
- Companies list: `GET /companies/all` (not `/companies`).
- Protected endpoints need `AuthMiddleware()` + `CheckPermission(...)`.
- Any master-data type used by a page other than its own settings page needs a `.../options` sibling endpoint (ungated by page permission) — never assume a plain CRUD `GET` is safe to call cross-page. See backend CLAUDE.md "Master-data `/options` convention" for the full list.

## Business Rules (Always Apply)

- `employees.companies_id` = home company for payroll, attendance, salary, department, position, employment type.
- `employee_company_access.company_id` = app access only, not payroll ownership.
- Employee-linked forms must cascade company → department/position/role/employment type/employee and reject mismatches.
- Time Logs: end <= start means overnight (e.g. `16:00` → `00:00` checks out next day).
- Leave Requests: only `Pending` status can be edited.
- **Company field is immutable after creation** everywhere: the "Companies" `SelectField` must be `disabled={!!editingId}` on any edit form (Employees, Departments, Positions, Roles, EarningTypes, DeductionTypes, DayOff, ...) to match the backend rejecting `companies_id` changes on update.
- All wall-clock/time-of-day values (Attendance Config work start/end, Time Log check-in/out) are anchored to a fixed Asia/Bangkok (UTC+7, no DST) business timezone — never read/derive them with the browser's local `Date.getHours()`/`getMinutes()`, which is wrong whenever the viewer's machine isn't set to Bangkok. See `AttendanceSettingsPage.tsx`'s `toBangkokHM()` helper for the pattern.

## Shared UI Patterns

- **Missing master data**: use `src/components/common/MasterDataWarning.tsx` (message + conditional "Set it up" link, shown only if the user can access that settings module) instead of a bespoke warning box, whenever a form depends on a master-data type that might not be configured yet for the selected company (work locations, day-offs, leave types, attendance config, etc).
- Links to settings pages from these warnings use `target="_blank" rel="noopener noreferrer"` so the user doesn't lose in-progress form state — apply this to any new "Set it up" style link too.

## Commands

**Frontend:**
```bash
npm install && npm run dev          # run
npm run typecheck && npm run lint   # required after edits
npm run build                       # verify build
```

**Backend:**
```bash
go run .                            # run
gofmt -w <files> && go vet ./...    # required after edits
go test ./...                       # required after touching service/
go run ./seed                       # reseed data
docker compose -f docker-compose.local.yml up -d   # local Docker
docker compose -f docker-compose.uat.yml up -d     # UAT Docker
```
