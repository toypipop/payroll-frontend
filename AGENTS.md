# payroll-frontend — Codex instructions

## Scope and project

- This repository is the React 19 + Vite + TypeScript frontend of the payroll system. Dev server port: `5174`.
- The companion API is in `../payroll-backend`; read `../payroll-backend/AGENTS.md` before making changes that cross the API boundary, then decide whether both repos need updates.
- API base path is `/api/v1`. Keep `VITE_API_URL=/api/v1` in every environment; Vite/nginx proxies `/api` to the backend.
- `.env` is local-only and gitignored. Never add secrets or real environment values to the repository.

## Auth and API contracts

- Authentication uses the httpOnly `auth_token` cookie. Do not use an Authorization header or return/store JWTs in bodies.
- Auth endpoints are login, `/auth/me`, and logout beneath `/api/v1`.
- `App.tsx` fetches `/auth/me`; access the signed-in user only through `useAuth()` / `AuthProvider`. Do not use `localStorage`.
- `GET /api/v1/modules` is public and drives dynamic routes, sidebar, and breadcrumbs. Module keys must match page filenames; backend icons must exist in `src/components/common/Sidebar.tsx`.
- Dashboard and My Payslips are universal hardcoded pages, not backend modules. Do not add them to the module tree or permission matrix.
- Use `GET /companies/options` for company dropdowns and `GET /companies/all` for a full company list. Cross-page master-data dropdowns use their dedicated `/options` endpoint, not a gated CRUD list.
- Permission UI is entirely driven by backend module capability data (`scope_level`, actions, scopes, atomic flag). Do not introduce hardcoded permission/module lists.
- A new module page needs coordinated work: backend module seed, route, permission, module capability; frontend page, API calls, and icon mapping.

## Business and form rules

- `employees.companies_id` is payroll ownership; `employee_company_access.company_id` grants only application access. Cascade employee-linked selects by company and reject mismatches.
- The company field is immutable after creation. Edit forms disable the company selector when an existing record is edited.
- Only pending leave requests are editable. A time-log end time less than or equal to the start means an overnight shift.
- Salary history is a timeline. All changes—including delete—require a reason and surface an audit trail.
- Salary edits must round-trip the supplied record version. HTTP 412 means stale data and should prompt reload; HTTP 409 means a correctable business conflict that keeps the form open.
- Bulk salary raises are previewed before apply and are all-or-nothing. Keep apply disabled when the preview reports blocked rows.
- Transaction figures are snapshots from the last payroll run; open cycles can be stale and the UI must communicate that rather than recalculating client-side.

## Time and dates

- All business wall-clock and date handling is Asia/Bangkok (UTC+7). Use only `src/utils/bangkokTime.ts` helpers for business times and date keys.
- Do not use browser-local `Date` getters, `toLocaleTimeString`, `toISOString().split("T")[0]`, or naive `new Date(value).toISOString()` for business dates/times.
- Format displayed dates with `timeZone: "Asia/Bangkok"`.
- Send calendar dates to the API as bare `YYYY-MM-DD` strings.
- Convert datetime-local input with `bangkokLocalToISO` outbound and `isoToBangkokLocal` inbound.

## UI and styling

- Tailwind v4 is configured through `@tailwindcss/vite`; all design tokens live in `src/index.css`.
- Put project CSS rules in `@layer base`. Do not name custom tokens after Tailwind scale/token names such as `--radius-lg`, `--color-*`, or `--spacing-*`.
- Never put hex colours in components. Use existing CSS tokens and Tailwind token utilities.
- Use `components/common/tone.ts` for data-dependent visual tones; add a tone there before using arbitrary inline colour styles.
- A component accepting `className` must merge it with `twMerge` so callers can override defaults.
- Inline styles are reserved for runtime geometric values such as portal placement; use classes for normal styling.
- Reuse shared UI patterns: `MasterDataWarning` for missing setup data; settings links open in a new tab with `rel="noopener noreferrer"`; common controls belong in `components/common/`.

## TypeScript and page organization

- TypeScript `strict` and `noImplicitAny` are enabled.
- Wire/envelope types belong in `src/types/api.ts`; optional-field domain rows in `src/types/domain.ts`; report envelopes in `src/types/reports.ts`.
- Caught errors are `unknown`; use `src/utils/apiError.ts` helpers rather than accessing Axios response fields directly.
- Type table definitions as `TableColumn<T>[]`.
- Form types derive from their Zod schema (`z.infer` or `z.input` for coercion).
- Keep page files focused on columns and layout. Server data belongs in feature hooks, modal schemas/save state in feature modals, and non-React helpers in plain helper modules. A modal owns its own form state and reseeds from its `editing` prop.

## Run and verify

Run commands from `payroll-frontend`:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

- After frontend changes, run at least `npm run typecheck && npm run lint`; run `npm test` for pure-helper changes and `npm run build` before delivery when practical.
- The Vite server is pinned to port 5174. If it is occupied, identify the process and ask before stopping an unknown process.
- Backend proxy target defaults to `http://localhost:8000`; without a running backend, login and dynamic routes fail as expected.
- Dynamic protected routes depend on `/modules`; only login/dashboard are static without the backend.
- For visual checks, start the dev server and use a headless browser screenshot. Wait for `domcontentloaded` plus a short settle delay; do not use `networkidle` because Vite HMR keeps a websocket open.

## Deployment safety

- Coordinate frontend-facing API changes with `../payroll-backend`.
- Do not deploy or reset infrastructure unless the user explicitly asks. Backend deployment is manual and deploys both repositories from the same branch.
