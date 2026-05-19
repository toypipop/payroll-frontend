# AGENTS.md

Agent playbook for `payroll-frontend`.
This repository is a React + Vite frontend for payroll, attendance, and reporting modules.
Use these rules when editing code, adding tests, and running local checks.
The companion API lives next to this repo at `../payroll-backend`.

## Rule Sources

- Checked `.cursor/rules/`: not present.
- Checked `.cursorrules`: not present.
- Checked `.github/copilot-instructions.md`: not present.
- Therefore, this file is the canonical agent guidance in this repo.
- Read this frontend `AGENTS.md` first for frontend work.
- If a task touches backend APIs, routes, modules, auth, permissions, seed data, or response shapes, also read `../payroll-backend/AGENTS.md` before making changes.

## Project Layout

- `src/main.tsx`: app bootstrap and root render.
- `src/App.tsx`: protected route wiring and backend-driven route registration from `/modules`.
- `src/api/axiosInstance.ts`: axios client, credentialed cookie requests, 401 redirect handling.
- `src/types/*`: shared TypeScript API/domain/component types.
- `src/pages/*`: feature pages by module (`auth`, `employees`, `attendance`, etc.).
- `src/components/common/*`: reusable UI primitives (fields, table, modal, buttons).
- `src/components/common/Sidebar.tsx`: backend-driven navigation tree from `/modules`.
- `src/components/common/Navbar.tsx`: page title/breadcrumb shell and sign-out control.
- `src/components/layouts/MainLayout.tsx`: global shell and navigation.
- `src/hooks/*`: reusable UI/data hooks.
- `src/index.css` + `src/App.css`: global and app-level styling.

## Environment Assumptions

- Runtime: Node.js + npm.
- Bundler/dev server: Vite (`vite` via npm scripts).
- Language: TypeScript for app source (`.ts`/`.tsx`); keep new React files typed.
- React version: `19.x` (`react`/`react-dom` currently `^19.2.0`).
- Router: `react-router-dom` v7.
- Form and validation stack: `react-hook-form`, `@hookform/resolvers`, and `zod`.
- UI helpers include `lucide-react`, `react-datepicker`, and Tailwind CSS v4.
- API base URL comes from `VITE_API_URL` in `.env`.
- Local frontend `.env` currently points to `http://localhost:8000/api/v1`.
- Companion backend default URL is `http://localhost:8000/api/v1`.

## Build, Lint, and Test Commands

Run from repository root.

### Install and run

- `npm install` - install dependencies.
- `npm run dev` - run local development server.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run build` - run TypeScript check and create production build in `dist/`.
- `npm run preview` - serve built app locally.

### Local MySQL Docker

- Added May 19, 2026: `docker-compose.yml` is intentionally MySQL-only for local development; do not add frontend or backend containers unless explicitly requested.
- Start the local database from this frontend repo with `docker compose up -d`.
- Check database status with `docker compose ps` and logs with `docker compose logs -f mysql`.
- The MySQL container is `payroll-mysql`, publishes `localhost:3306`, and creates `PayrollDB`.
- Backend local `.env` should use `DB_USER=root`, `DB_PASSWORD=1234`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, and `DB_NAME=PayrollDB`.
- Run the backend locally from `../payroll-backend` with `go run .`; it connects to the Docker MySQL database and runs migrations.
- Stop the database with `docker compose stop`; remove the container with `docker compose down`; remove all local MySQL data with `docker compose down -v`.
- If Docker commands fail with `dockerDesktopLinuxEngine` pipe errors, Docker Desktop is not running. Start it with `Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"` from PowerShell, wait until Docker is ready, then retry.

### Lint and formatting

- `npm run lint` - run ESLint using `eslint.config.js`.
- `npm run typecheck` - run TypeScript validation using `tsconfig.json`.
- If formatting changes are introduced, keep style consistent with existing files.

### Tests (Vitest)

- There is currently no `test` script in `package.json`.
- There are currently no committed `*.test.*` or `*.spec.*` files in `src/`.
- Use direct Vitest commands:
- `npx vitest` - run full test suite in watch mode.
- `npx vitest run` - run tests once (CI style).
- `npx vitest run --coverage` - run tests with coverage.

### Run a single test (important)

- Single file:
- `npx vitest run src/pages/auth/LoginPage.test.tsx`
- Single test by name:
- `npx vitest run -t "shows login error"`
- Single file + single test name:
- `npx vitest run src/pages/auth/LoginPage.test.tsx -t "submits valid credentials"`
- Single suite in watch mode:
- `npx vitest src/components/common/Table.test.tsx`

## Development Workflow for Agents

- Prefer small, module-scoped changes (page + shared component + API call if needed).
- Preserve existing route naming and module-key conventions used by backend-driven menus.
- Keep UI behavior aligned with backend permission/data-scope responses.
- If behavior changes, add/update tests near the changed component/page.
- Run at least `npm run typecheck`, `npm run lint`, and `npm run build` before finishing.
- For changes that touch API contracts, check `../payroll-backend/routes/routes.go`, handlers, models, and seed module definitions before editing frontend assumptions.

## Code Style Guidelines

### Imports

- Keep imports grouped and stable: external packages first, then internal modules, then styles.
- Use relative paths consistent with current file patterns.
- Remove unused imports; ESLint is configured to fail on unused vars/imports.
- Prefer `import type` for TypeScript-only imports.

### Formatting and structure

- Match existing TSX/TS style in surrounding files.
- Prefer clear, readable component structure over dense inline logic.
- Use early returns for loading/error guards.
- Keep components focused; extract reusable logic to hooks/helpers when repeated.
- Avoid `any` unless a third-party or legacy boundary makes a narrower type impractical; prefer shared interfaces from `src/types`.

### Components and state

- Prefer functional components and hooks.
- Keep local state minimal and derive values when possible.
- For forms, follow existing `react-hook-form` + field component patterns where present.
- Keep controlled input behavior predictable and trim/sanitize where needed.

### Naming conventions

- Components: `PascalCase` (`LoginPage`, `MainLayout`).
- Hooks: `camelCase` starting with `use` (`useTransactionsData`).
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- File names: follow existing convention (`PageName.tsx`, `fieldName.ts`/`fieldName.tsx`).

### Routing and auth

- Register protected feature routes through the backend module data unless the page is a special static route such as `/login` or `/dashboard`.
- Keep login redirect and fallback route behavior consistent.
- Do not bypass auth checks for protected pages.
- Auth uses backend-set httpOnly JWT cookies. Do not store JWTs in `localStorage` or `sessionStorage`, and do not add manual `Authorization: Bearer` headers in frontend code.
- Keep `api` requests credentialed through `src/api/axiosInstance.ts` (`withCredentials: true`) so the browser sends the auth cookie automatically.
- Login should call `POST /auth/login`; the backend sets the cookie and the frontend may store only non-sensitive profile data such as `id`, `fullName`, `roles`, and `companies_id`.
- Protected route checks should rely on `GET /auth/me`, not on checking a frontend token.
- Logout should call `POST /auth/logout`, then clear non-sensitive frontend profile state and redirect to `/login`.
- Keep module-key-to-page resolution compatible with the backend `/modules` response.
- Backend `module_key` values must match frontend page filenames exactly, for example `EmployeesListPage` resolves to `src/pages/**/EmployeesListPage.tsx`.
- Sidebar categories come from modules with `is_category: true`; clickable pages need a `route_path`.

### API integration

- Use `src/api/axiosInstance.ts` instead of creating ad-hoc axios clients.
- Keep auth behavior centralized in `src/api/axiosInstance.ts`; do not attach JWTs manually.
- Type API request and response shapes with shared interfaces in `src/types` where practical.
- Call endpoints relative to `VITE_API_URL`; for example `api.get("/modules")` resolves to `/api/v1/modules` locally.
- Handle API failures with user-friendly messages; avoid leaking raw backend internals.
- Avoid hardcoding API URLs; use `import.meta.env.VITE_API_URL`.

### Backend contract notes

- Companion backend: `../payroll-backend`, written in Go with Gin, GORM, and MySQL.
- Backend entrypoint: `../payroll-backend/main.go`; route registration: `../payroll-backend/routes/routes.go`.
- Backend config defaults: MySQL at `127.0.0.1:3306`, DB name `PayrollDB`, server port `8000`, CORS origin `http://localhost:5173`.
- Backend auth: login is `POST /api/v1/auth/login`, session check is `GET /api/v1/auth/me`, and logout is `POST /api/v1/auth/logout`; protected endpoints authenticate through the httpOnly `auth_token` cookie.
- `/api/v1/modules` is currently public and returns active `AppModule` rows sorted by `order`.
- Module seed data is in `../payroll-backend/seed/main.go`; permission checks in `routes.go` use the same module-key names as frontend page files.
- If adding a new page, update all needed pieces together: backend seed module, backend route/permission if data is needed, frontend page file, and frontend API calls.

### Tables and index pages

- Use `src/components/common/Table.tsx` for index/list pages unless the view needs a genuinely custom table.
- Shared table search is enabled by default and should work across key-based, nested, and rendered-text columns.
- Header sorting is automatic when a column has `key`, `sortKey`, `sortValue`, `searchValue`, or sortable rendered text; action/blank command columns are excluded automatically.
- For complex rendered columns, provide `sortValue`, `searchValue`, or `searchableKeys` when the rendered text alone is not enough.
- Mark command-only columns with `sortable: false` when their label is not blank or "Actions".
- Keep company-scoped form options cascaded from the selected company, including department, position, roles, and employment type.

### Error handling and UX

- Show actionable error states in UI (empty state, validation, server failure).
- Avoid silent failures; log diagnostics only when useful for debugging.
- Keep loading states explicit for async page-level fetches.

### Styling and design consistency

- Reuse existing common components before adding new primitives.
- Keep spacing, color, radius, and typography consistent with current UI language.
- Prefer shared CSS tokens/variables and avoid one-off inline styles when reusable.
- Ensure layouts remain usable on desktop and mobile breakpoints.

### Security and data safety

- Never commit secrets or production tokens.
- Do not store JWTs, refresh tokens, or other secrets in `localStorage` or `sessionStorage`.
- Only store non-sensitive user display/profile data on the frontend when needed for UI.
- Sanitize/validate user input before sending requests when practical.

### Local agent artifacts

- Keep local agent cache files out of source control (`.agents/`, `skills-lock.json`).
- If working on multiple machines, sync these artifacts privately (or reinstall locally) rather than committing them.

## Agent Skills

The following specialized skills are available in the `.agents/skills/` directory. The agent should reference their respective `SKILL.md` files when working on related tasks:

- **accessibility**: Audit and improve web accessibility following WCAG 2.2 guidelines.
- **frontend-design**: Create distinctive, production-grade frontend interfaces with high design quality.
- **nodejs-backend-patterns**: Build production-ready Node.js backend services.
- **nodejs-best-practices**: Node.js development principles and decision-making.
- **seo**: Optimize for search engine visibility and ranking.
- **tailwind-css-patterns**: Comprehensive Tailwind CSS utility-first styling patterns.
- **vercel-composition-patterns**: React composition patterns that scale.
- **vercel-react-best-practices**: React and Next.js performance optimization guidelines.
- **vite**: Vite build tool configuration, plugin API, and SSR.
- **vitest**: Vitest fast unit testing framework powered by Vite.

## Testing Guidance

- Use Vitest + Testing Library for UI and interaction tests.
- Co-locate tests with components/pages when practical.
- Focus assertions on behavior (rendered output, interactions, API side effects).
- For auth-sensitive pages, test both authenticated and unauthenticated flows.
- For table/forms, test validation and key edge cases.

## Definition of Done (for agent changes)

- Code compiles and builds (`npm run build`).
- TypeScript passes (`npm run typecheck`).
- Lint passes (`npm run lint`).
- Relevant tests pass (`npx vitest run` or targeted single-test commands).
- Routing/auth behavior remains consistent.
- No secrets added; environment-driven config preserved.
