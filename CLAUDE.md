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
- **The Transactions page says when its figures were calculated.** It reads what the last run stored and never recalculates, so on a cycle that is still open the numbers can be older than the data behind them; the line under the period shows the newest `updated_at` among the cycle's transactions, and points at Run Payroll when the cycle is open. Closing a cycle recalculates it first, so a closed cycle's figures are never stale — which is why this is a note rather than a guard.
- **Salary history is a timeline, and the Edit button on a row moves it.** `SalaryRecordEditModal` sends `PATCH /salaries/:id` with the record's own `version`; a **412** means the row moved underneath the form (reload), while a **409** names something the user can fix in the form that stays open — another record already on that date, or a period already paid out. A row the payroll already paid against shows "Locked" and offers neither Edit nor Delete.
- **Editing a salary sends the `version` it was seeded from.** The backend refuses the save with **412**
  (`apperr.Precondition`) when that record has moved since, and `SalaryFormModal` turns the 412 into "changed by
  someone else" plus a reload rather than retrying. Anything else that becomes concurrently editable needs the
  same round trip. Sending no version is not a way out: `PATCH /salaries/:id` compares the value rather than
  checking it is present, so an omitted version answers 412 like any other mismatch.
- **Every salary change carries a reason, and lands in a change log.** `SalaryFormModal`, `SalaryRecordEditModal` and the delete prompt all require one — the Delete button is a form now rather than a `window.confirm`, because it had no place to collect one. `GET /salaries/audit/:employees_id` reads the trail back; it is a separate call from the history because an entry outlives its record, and a delete leaves one saying what was removed. `salaries/auditLine.ts` turns an entry into the line the modal shows.
- **Company field is immutable after creation** everywhere: the "Companies" `SelectField` must be `disabled={!!editingId}` on any edit form (Employees, Departments, Positions, Roles, EarningTypes, DeductionTypes, DayOff, ...) to match the backend rejecting `companies_id` changes on update.
- All wall-clock/time-of-day values (Attendance Config work start/end, Time Log check-in/out) are anchored to a fixed Asia/Bangkok (UTC+7, no DST) business timezone — never read/derive them with the browser's local `Date.getHours()`/`getMinutes()`/`toLocaleTimeString()`, which is wrong whenever the viewer's machine isn't set to Bangkok. `src/utils/bangkokTime.ts` is the only place that knows the offset: `toBangkokHM`, `formatTime`, `formatDisplayTime`, `bangkokDateKey`, `bangkokMinutes`, and the datetime-local pair `bangkokLocalToISO` / `isoToBangkokLocal`.
- **A date is rendered in the business timezone too.** Every `toLocaleDateString` in the app passes `timeZone: "Asia/Bangkok"`; without it a cycle running 01–30 Apr Bangkok reads as 31 Mar–29 Apr to a viewer in New York, because the stored instant is 17:00 the previous day there.
- **"Today" is `bangkokDateKey(new Date())`, never `new Date().toISOString().split("T")[0]`.** The latter is the UTC calendar day, so between 00:00 and 07:00 Bangkok a form seeded that way defaults to *yesterday* — which for a salary's effective date silently backdates the raise into the previous period.
- **A calendar date goes to the API as bare `YYYY-MM-DD`.** Do not pin an offset on it — `CycleFormModal` used to send `data.start_date + "T00:00:00Z"`, which is how `payroll_cycle` ended up holding two storage conventions at once. The server reads the bare text as a whole day in the business timezone (`timeutil.ParseDayStart`) and stores a period's end at 23:59:59 of its last day.
- **A period covers whole business days, so `closedCycles.ts` compares instants, not day keys.** A cycle runs `00:00:00+07:00` to `23:59:59+07:00`, so any instant inside the typed day gives the same verdict; the comparison mirrors the server's rather than reducing either side to a calendar day, which would have to special-case the closing instant. Verified against the live API on every boundary date of a closed/open pair.
- A datetime-local input holds naive `YYYY-MM-DDTHH:MM` text. Convert it with `bangkokLocalToISO` on the way out and `isoToBangkokLocal` on the way in — `new Date(value).toISOString()` reads that text in the viewer's timezone and silently shifts what the user typed.

## Styling

Tailwind v4 is wired through `@tailwindcss/vite`; `src/index.css` holds the tokens and `@theme` maps them onto
utility names, so `bg-card`, `text-muted` and `border-line` resolve to the same variables the older inline
styles read. Change a colour in `:root` and both spellings follow.

Three rules the hard way:

- **Project CSS belongs in `@layer base`.** An unlayered rule outranks every Tailwind utility whatever its
  specificity, so the plain `*, *::before, *::after { padding: 0 }` reset silently flattened `px-4` everywhere.
- **Do not name a token after a Tailwind scale.** The project declared `--radius-lg: 14px`, which is the name
  Tailwind uses for its own scale, so every `rounded-lg` in the app became 14px instead of 8px. Same trap for
  `--color-*`, `--font-*`, `--spacing-*`.
- **A component that accepts `className` merges with `twMerge`.** Concatenating strings does not let a caller
  override anything: Tailwind resolves conflicts by CSS order, not by attribute order, so `<Card className="p-0">`
  would still be padded by the `px-6` in the component.

- **No hex literal lives in a component.** `src/index.css` holds every colour the app uses, including the status
  surfaces (`--status-*-soft/-line/-text`) and the brand shades behind the logo gradient and the sign-in backdrop.
- **Tailwind's own palette is switched off** (`--color-*: initial` in `@theme`, keeping only white and black), so
  `bg-slate-100` does not exist. A colour comes from a token or it does not come at all.

- **A colour that depends on the data is a tone, not a colour.** `components/common/tone.ts` maps
  `neutral | brand | success | danger | accent | muted` onto classes, so a card or a figure takes
  `tone="success"`, never `color="var(--status-success)"`. Add a tone there before reaching for a style
  attribute.

Only two inline `style` attributes remain in the whole app — the portal positions in `SelectField` and
`DetailDropdown`, which are `top`/`left`/`width` in px measured from the trigger with
`getBoundingClientRect()` when the panel opens. A class cannot hold a number that does not exist until
render, and moving the same assignment into a ref would only hide it from grep. Everything else is a class.

## TypeScript

`strict` and `noImplicitAny` are **on**. Three files carry the weight:

- **`src/types/api.ts`** — the wire shapes that are not domain rows: `AppModule`, `PayrollCycle`, `PayrollTransaction`,
  the run/pre-check/diff responses, and the `TableColumn<T>` the tables are generic over.
- **`src/types/domain.ts`** — the API's rows, named after the backend models. **Every field is optional**, because a
  list endpoint, an `/options` endpoint and a detail endpoint return different subsets of the same row; a required
  field would be a lie on two of the three. A dropdown list built by a hook is `OptionRow[]`, not the full record.
- **`src/types/reports.ts`** — one envelope per report endpoint (cycle, company, rows, totals).

Two rules that come up on every page:

- **A caught error is `unknown`.** Never reach for `err.response` — `src/utils/apiError.ts` has
  `apiErrorMessage(err, fallback)` (server message, plus the delete guard's `reason`), `apiErrorBody`, and
  `apiErrorStatus`. That is also the only place that knows the `{ error, reason }` shape the API returns.
- **A table's columns are typed, and that types the renders.** Write `const columns: TableColumn<Employee>[] = [...]`
  and every `render: (row) => ...` gets `row` for free. `TableColumn<T extends object>` deliberately does not require
  an index signature, so the plain domain interfaces fit.

A form's values come from its schema: `type XFormValues = z.infer<typeof schema>`, or `z.input<...>` where the fields
hold strings that zod coerces (see `EmployeeFormModal`). `SelectField`'s option only needs `{ id?, name? }`.

## Page Layout

Every page follows the same split, so a page file is table columns plus layout and nothing else:

```
pages/<area>/<Page>.tsx          columns + layout, reads the hook, renders the modal
pages/<area>/<feature>/
    use<Feature>.ts              server data: the lists, the loading flag, delete
    <Feature>FormModal.tsx       the schema, the form, the save call, its own state
    helpers.ts                   pure functions, no React
```

- A modal owns its own state. The page only tracks whether it is open and which row is being edited, and passes that row as `editing`; the modal re-seeds itself from it in an effect. That is why no page reaches into a shared `reset()` any more.
- Pure functions live outside the component so they can be tested without rendering: `timelogs/scheduleHelpers.ts`, `salaries/salaryShape.ts`, `attendance-config/bangkokTime.ts`, `summaries/dateRange.ts`.
- Logic two pages share becomes one hook: `summaries/useAttendanceSummary.ts` (both summary pages), `reports/shared/useClosedCycleReport.ts` and `reports/shared/useA4Preview.ts` (every report).
- A control that is not domain-specific belongs in `components/common/` — `DetailDropdown` moved there from RunPayrollPage.

## Shared UI Patterns

- **Missing master data**: use `src/components/common/MasterDataWarning.tsx` (message + conditional "Set it up" link, shown only if the user can access that settings module) instead of a bespoke warning box, whenever a form depends on a master-data type that might not be configured yet for the selected company (work locations, day-offs, leave types, attendance config, etc).
- Links to settings pages from these warnings use `target="_blank" rel="noopener noreferrer"` so the user doesn't lose in-progress form state — apply this to any new "Set it up" style link too.
- **Colours come from the tokens in `src/index.css`**, spelled as Tailwind utilities (`text-main`, `border-line-muted`, `bg-surface`, `bg-control`, `text-danger`, ...) and only as `var(--token)` where the value is computed at runtime. Do not paste a hex a token already covers.
- Both accents are the project teal now: `--control-accent` (buttons, pickers, active states) was a violet and was mapped onto the brand teal. SVG `stroke=`/`fill=` attributes still take literal `var(--token)` values, since those are presentation attributes rather than styles.
- Field components (`InputField`, `NumberField`, `DecimalField`, `SelectField`) take `className` for the control and `containerClassName` for the wrapper — both merged with `twMerge`. Use `containerClassName="mb-0"` rather than `containerStyle={{ marginBottom: 0 }}`.

## Commands

**Frontend:**
```bash
npm install && npm run dev          # run
npm run typecheck && npm run lint   # required after edits
npm test                            # vitest, node env, src/**/*.test.ts — pure helpers only, no jsdom
npm run build                       # verify build
```

**Backend:**
```bash
go run .                            # run
gofmt -w <files> && go vet ./...    # required after edits
go test ./...                       # required after touching service/
go run ./seed                       # reseed data (merges onto existing rows)
go run ./seed --reset               # wipe every table first, then reseed from empty
docker compose -f docker-compose.local.yml up -d   # local Docker
docker compose -f docker-compose.uat.yml up -d     # UAT Docker
```
