# AGENTS.md

Compact playbook for `payroll-frontend`, a React + Vite frontend for payroll, attendance, and reporting. The companion API is `../payroll-backend`; read its `AGENTS.md` when work touches routes, modules, auth, permissions, seed data, API contracts, or response shapes.

## Stack

- React `19.x`, Vite, TypeScript, `react-router-dom` v7.
- Forms: `react-hook-form`, `@hookform/resolvers`, `zod`.
- UI helpers: `lucide-react`, `react-datepicker`, Tailwind CSS v4.
- Vite dev URL: `http://localhost:5174`.
- API base URL: `VITE_API_URL`; use `/api/v1` for local, SIT, UAT, and prod same-origin deployments.
- Local Vite proxy target: `API_PROXY_TARGET`; defaults to `http://localhost:8001`.

## Layout

- `src/App.tsx`: auth guard and backend-driven page registration from `/modules`.
- `src/api/axiosInstance.ts`: credentialed axios client and 401 handling.
- `src/components/common/Sidebar.tsx`: backend-driven navigation and icon map.
- `src/components/common/Navbar.tsx`: title/breadcrumb shell and logout.
- `src/components/common/Table.tsx`: default table for list/index pages.
- `src/components/common/SelectField.tsx`: custom select that emits select-like events for `react-hook-form`.
- `src/components/common/DateTimeField.tsx`: attendance datetime picker; error state should match select/input red borders.
- `src/pages/*`: feature pages by backend module key.
- `src/types/*`: shared API/domain/component types.

## Commands

- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run preview`
- Tests, when needed: `npx vitest run`, `npx vitest run src/path/File.test.tsx`, `npx vitest run -t "test name"`.

## Workflow

- Prefer small module-scoped changes and reuse common components.
- Keep imports grouped: external packages, internal modules, styles.
- Use `import type` for TypeScript-only imports.
- Keep loading, empty, validation, and server-error states explicit.
- Use `src/api/axiosInstance.ts`; do not create ad-hoc axios clients.
- For API changes, verify method/path exists in backend `routes.go`.
- Custom controls that reset dependent fields should use `setValue(..., { shouldValidate: true, shouldDirty: true })`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` after code changes.

## Auth And API

- Auth is backend-set httpOnly cookie JWT.
- Do not store JWTs or add manual `Authorization: Bearer` headers.
- Login: `POST /auth/login`; protected check: `GET /auth/me`; logout: `POST /auth/logout`.
- Frontend may store only non-sensitive profile data: `id`, `fullName`, `roles`, `companies_id`, `accessible_company_ids`.
- Company dropdowns/options must use `GET /companies/options`.
- `GET /companies` is not a backend route; `GET /companies/all` is only for the Companies list page.

## Backend-Driven Modules

- Protected routes come from backend `/modules`; static routes are `/login` and `/dashboard`.
- Backend `module_key` values must match page filenames exactly, e.g. `EmployeesListPage`.
- Sidebar categories use `is_category: true`; clickable pages need `route_path`.
- Backend `icon` values must exist in `src/components/common/Sidebar.tsx`.
- New pages usually need backend seed module, route/permission, frontend page file/API calls, and icon mapping.
- Payroll category APIs are `/master/earning-categories` and `/master/deduction-categories`.

## Business/UI Rules

- `employees.companies_id` is the home company for payroll, attendance, salary, department, position, and employment type.
- `employee_company_access.company_id` is app access only.
- Employee-linked forms should cascade company -> department/position/role/employment type/employee and reject employee/company mismatches.
- `EmployeeCompanyAccessPage` filters roles by selected company; normally one mapping per employee has `is_default: true`.
- Time Logs cascade company -> employee -> work location.
- Time Logs auto-fill check-in/out from attendance config. End time <= start time means checkout is next day.
- When Check In is adjusted, Check Out recalculates using configured shift duration, including `16:00` to `00:00`.
- Leave Requests: only `Pending` can edit; approved/non-pending rows may still be deleted if backend permits.
- Leave Request selects must validate immediately after choosing company, employee, or leave type.

## Tables And UI

- Use `src/components/common/Table.tsx` unless a custom table is truly needed.
- Shared table search/sort works across keys, nested keys, rendered text, `sortValue`, `searchValue`, and `searchableKeys`.
- Mark command-only columns with `sortable: false` unless label is blank or `"Actions"`.
- Keep company-scoped option cascades consistent.

## Reports And Print Previews

- "Full-screen modal" means a portal modal via `createPortal(..., document.body)`, outside page/card layout, with background scroll locked.
- Report print previews should not render inline inside cards when full-screen behavior is requested.
- `A4*` components are printed document layouts: `A4Payslip`, `A4BankSummary`, `A4SSO`, `A4PND1`, `A4Tawi50`. Edit these for document content/layout; edit the portal/modal shell for preview behavior.
- Full-screen portal print previews currently exist for Payslips, Bank Transfer, Tax Forms (PND.1/50 Tawi), and SSO.
- On `/transactions`, the table intentionally omits the repeated Cycle column because the selected cycle is already shown above the table.

## Definition Of Done

- TypeScript, lint, and build pass or blockers are explained.
- Relevant tests pass when present.
- Routing/auth behavior remains consistent.
- No secrets or local agent artifacts (`.agents/`, `skills-lock.json`) added.
