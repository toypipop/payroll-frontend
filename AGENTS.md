# AGENTS.md

Compact playbook for `payroll-frontend`, a React + Vite frontend for payroll, attendance, and reporting. The companion API is `../payroll-backend`; read its `AGENTS.md` whenever a task touches routes, modules, auth, permissions, seed data, API contracts, or response shapes.

## Stack And Layout

- React `19.x`, Vite, TypeScript, `react-router-dom` v7.
- Forms use `react-hook-form`, `@hookform/resolvers`, and `zod`.
- UI helpers include `lucide-react`, `react-datepicker`, and Tailwind CSS v4.
- Vite dev server runs at `http://localhost:5174`.
- API base URL comes from `VITE_API_URL`; local `.env` points to `http://localhost:8000/api/v1`.
- Key files:
- `src/App.tsx`: auth guard and backend-driven page registration from `/modules`.
- `src/api/axiosInstance.ts`: credentialed axios client and 401 handling.
- `src/components/common/Sidebar.tsx`: backend-driven navigation and icon map.
- `src/components/common/Navbar.tsx`: title/breadcrumb shell and logout.
- `src/pages/*`: feature pages by module.
- `src/types/*`: shared API/domain/component types.

## Commands

Run from the frontend root.

- `npm install` - install dependencies.
- `npm run dev` - start Vite.
- `npm run typecheck` - TypeScript check.
- `npm run lint` - ESLint.
- `npm run build` - TypeScript check plus production build.
- `npm run preview` - serve the built app.
- Tests use direct Vitest commands because there is no `test` script yet:
- `npx vitest run`
- `npx vitest run src/path/File.test.tsx`
- `npx vitest run -t "test name"`

## Docker And Local API

- Docker database files live in `../payroll-backend`; keep database infrastructure there unless explicitly requested.
- Start MySQL from `../payroll-backend` with `docker compose up -d`.
- Backend local DB defaults: `DB_USER=root`, `DB_PASSWORD=1234`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME=PayrollDB`.
- Run the backend from `../payroll-backend` with `go run .`.
- If Docker Desktop is not running, Docker commands may fail with `dockerDesktopLinuxEngine` pipe errors.

## Workflow

- Prefer small, module-scoped changes.
- Reuse common components before adding new primitives.
- Keep imports grouped: external packages, internal modules, styles.
- Use `import type` for TypeScript-only imports.
- Prefer shared interfaces from `src/types`; avoid `any` unless a boundary makes it impractical.
- Keep loading, empty, validation, and server-error states explicit.
- Run at least `npm run typecheck`, `npm run lint`, and `npm run build` before finishing when code changed.
- When adding/changing API calls, verify the frontend method/path exists in backend `routes.go`; dropdown failures often come from route mismatches rather than empty data.

## Auth And API

- Always use `src/api/axiosInstance.ts`; do not create ad-hoc axios clients.
- Auth is cookie-based with backend-set httpOnly JWT cookies.
- Do not store JWTs in `localStorage` or `sessionStorage`.
- Do not add manual `Authorization: Bearer` headers.
- Login calls `POST /auth/login`; frontend may store only non-sensitive profile data such as `id`, `fullName`, `roles`, `companies_id`, and `accessible_company_ids`.
- Protected route checks use `GET /auth/me`.
- Logout calls `POST /auth/logout`, clears non-sensitive profile state, and redirects to `/login`.
- Keep requests relative to `VITE_API_URL`; for example `api.get("/modules")` resolves to `/api/v1/modules`.
- Company dropdowns/options must use `GET /companies/options`.
- `GET /companies` is not a backend route.
- `GET /companies/all` is only for the Companies settings index/list page.

## Backend-Driven Modules

- Protected feature routes come from backend `/modules`; special static routes are `/login` and `/dashboard`.
- Backend `module_key` values must match frontend page filenames exactly, for example `EmployeesListPage` resolves to `src/pages/**/EmployeesListPage.tsx`.
- Sidebar categories use modules with `is_category: true`; clickable pages need a `route_path`.
- Backend module `icon` values must exist in `src/components/common/Sidebar.tsx`; missing keys render the generic `Default` icon.
- If adding a new page, update backend seed module, backend route/permission if needed, frontend page file, frontend API calls, and sidebar icon mapping if a new icon name is used.
- Payroll config category APIs are `/master/earning-categories` and `/master/deduction-categories`; keep `EarningCategoryPage`, backend routes, handlers, delete guards, and seed module data aligned.

## Company Access Rules

- `employees.companies_id` is the employee's primary/home company for payroll, attendance, department, position, salary, and employment type logic.
- `employee_company_access.company_id` is app access, not payroll ownership.
- Use `EmployeeCompanyAccessPage` and `/employee-company-access` to grant extra company/role access.
- Creating an employee should save both primary `employees.companies_id` and an active/default `employee_company_access` row for that same company/role.
- Employee-linked forms must put company first, filter employees by company, reset employee-dependent fields when company changes, and submit the selected company value when the backend model supports it.
- Prevent submitting an employee from a different company.
- On `EmployeeCompanyAccessPage`, filter role options by selected company; normally only one mapping per employee should have `is_default: true`.

## Tables And UI

- Use `src/components/common/Table.tsx` for list/index pages unless a custom table is truly needed.
- Shared table search is enabled by default and works across key-based, nested, and rendered-text columns.
- Sorting is automatic when a column has `key`, `sortKey`, `sortValue`, `searchValue`, or sortable rendered text.
- Provide `sortValue`, `searchValue`, or `searchableKeys` for complex rendered columns.
- Mark command-only columns with `sortable: false` when their label is not blank or `"Actions"`.
- Keep company-scoped option cascades consistent: company -> department, position, roles, employment type, employee.

## Security And Artifacts

- Never commit secrets or production tokens.
- Store only non-sensitive display/profile data on the frontend.
- Validate/sanitize user input before sending requests when practical.
- Keep local agent artifacts out of source control: `.agents/`, `skills-lock.json`.

## Skills

Use relevant local skills when the task matches: accessibility, frontend-design, seo, tailwind-css-patterns, vercel-react-best-practices, vercel-composition-patterns, vite, vitest, nodejs-backend-patterns, and nodejs-best-practices.

## Definition Of Done

- TypeScript passes.
- Lint passes.
- Build passes.
- Relevant tests pass, or any inability to run them is explained.
- Routing/auth behavior remains consistent.
- No secrets added; environment-driven config preserved.
