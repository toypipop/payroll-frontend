# AGENTS.md

Compact playbook for `payroll-frontend`, the React 19 + Vite + TypeScript UI for payroll, attendance, and reports. Read `../payroll-backend/AGENTS.md` when work touches routes, modules, auth, permissions, seed data, API contracts, or response shapes.

## Core

- Dev URL: `http://localhost:5174`; local proxy target: `API_PROXY_TARGET`, default `http://localhost:8001`.
- Keep `VITE_API_URL=/api/v1` for local Docker, SIT, UAT, and prod same-origin deployments.
- Browser calls `/api/v1`; Vite/nginx/reverse proxy forwards `/api` to backend.
- `.env` is local-only and ignored; `.env.example` lists required keys only.
- Current UAT: frontend `http://5.223.87.23:5174`, direct API `http://5.223.87.23:8001/api/v1`.

## Key Files

- `src/App.tsx`: auth guard and backend-driven page registration from `/modules`.
- `src/api/axiosInstance.ts`: only axios client; credentialed requests and 401 handling.
- `src/components/common/Sidebar.tsx`: backend navigation and icon map.
- `src/components/common/Table.tsx`: default list/index table; supports nested/rendered/search/sort values.
- `src/components/common/SelectField.tsx`: select-like events for `react-hook-form`.
- `src/components/common/DateTimeField.tsx`: attendance picker; error border matches inputs/selects.
- `src/pages/*`: page files keyed by backend `module_key`.

## Commands

- Install/run: `npm install`, `npm run dev`, `npm run preview`.
- Required after code edits: `npm run typecheck`, `npm run lint`, `npm run build`.
- Tests when useful: `npx vitest run`, `npx vitest run src/path/File.test.tsx`, `npx vitest run -t "test name"`.

## Workflow

- Prefer small module-scoped changes and common components.
- Group imports as external, internal, styles; use `import type` for type-only imports.
- Keep loading, empty, validation, and server-error states explicit.
- Verify changed frontend API paths against backend `routes.go`.
- For dependent form resets, use `setValue(..., { shouldValidate: true, shouldDirty: true })`.
- Do not add secrets or local agent artifacts such as `.agents/` or `skills-lock.json`.

## Auth/API

- Auth is backend-set httpOnly cookie JWT; never store JWTs or add browser `Authorization` headers.
- Login/check/logout: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- Store only non-sensitive profile data: `id`, `fullName`, `roles`, `companies_id`, `accessible_company_ids`.
- Company options must use `GET /companies/options`.
- `GET /companies` is not a route; `GET /companies/all` is only for the Companies list.
- Payroll category APIs: `/master/earning-categories`, `/master/deduction-categories`.

## Modules/Navigation

- Protected routes come from backend `/modules`; static routes are `/login` and `/dashboard`.
- Backend `module_key` must match page filename exactly, e.g. `EmployeesListPage`.
- Sidebar categories use `is_category: true`; clickable pages need `route_path`.
- Backend `icon` values must exist in `Sidebar.tsx`.
- New pages usually need backend seed module, route/permission, frontend page/API calls, and icon mapping.

## Business/UI Rules

- `employees.companies_id` is home company for payroll, attendance, salary, department, position, and employment type.
- `employee_company_access.company_id` is app access only.
- Employee-linked forms cascade company -> department/position/role/employment type/employee and reject employee/company mismatches.
- `EmployeeCompanyAccessPage` filters roles by company; normally one employee mapping has `is_default: true`.
- Time Logs cascade company -> employee -> work location, auto-fill check-in/out from attendance config, and treat end <= start as next-day checkout.
- Adjusting Check In recalculates Check Out using shift duration, including `16:00` to `00:00`.
- Leave Requests: only `Pending` can edit; approved/non-pending rows may still be deleted if backend permits. Selects validate immediately.

## UI/Reports

- Use `Table.tsx` unless a custom table is necessary; command-only columns should set `sortable: false` unless blank or `Actions`.
- Keep company-scoped option cascades consistent.
- Full-screen report previews use `createPortal(..., document.body)`, outside page/card layout, with background scroll locked.
- `A4Payslip`, `A4BankSummary`, `A4SSO`, `A4PND1`, `A4Tawi50` are document layouts; edit portal/modal shell for preview behavior.
- On `/transactions`, omit repeated Cycle column because the selected cycle is already shown above the table.
