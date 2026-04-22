# AGENTS.md

Agent playbook for `payroll-frontend`.
This repository is a React + Vite frontend for payroll, attendance, and reporting modules.
Use these rules when editing code, adding tests, and running local checks.

## Rule Sources

- Checked `.cursor/rules/`: not present.
- Checked `.cursorrules`: not present.
- Checked `.github/copilot-instructions.md`: not present.
- Therefore, this file is the canonical agent guidance in this repo.

## Project Layout

- `src/main.jsx`: app bootstrap and root render.
- `src/App.jsx`: route registration and protected route wiring.
- `src/api/axiosInstance.js`: axios client, auth token injection, 401 redirect handling.
- `src/pages/*`: feature pages by module (`auth`, `employees`, `attendance`, etc.).
- `src/components/common/*`: reusable UI primitives (fields, table, modal, buttons).
- `src/components/layouts/MainLayout.jsx`: global shell and navigation.
- `src/hooks/*`: reusable UI/data hooks.
- `src/index.css` + `src/App.css`: global and app-level styling.

## Environment Assumptions

- Runtime: Node.js + npm.
- Bundler/dev server: Vite (`vite` via npm scripts).
- React version: `19.x`.
- Router: `react-router-dom`.
- API base URL comes from `VITE_API_URL` in `.env`.
- Backend default URL is usually `http://localhost:8000/api/v1`.

## Build, Lint, and Test Commands

Run from repository root.

### Install and run

- `npm install` - install dependencies.
- `npm run dev` - run local development server.
- `npm run build` - create production build in `dist/`.
- `npm run preview` - serve built app locally.

### Lint and formatting

- `npm run lint` - run ESLint using `eslint.config.js`.
- If formatting changes are introduced, keep style consistent with existing files.

### Tests (Vitest)

- There is currently no `test` script in `package.json`.
- Use direct Vitest commands:
- `npx vitest` - run full test suite in watch mode.
- `npx vitest run` - run tests once (CI style).
- `npx vitest run --coverage` - run tests with coverage.

### Run a single test (important)

- Single file:
- `npx vitest run src/pages/auth/LoginPage.test.jsx`
- Single test by name:
- `npx vitest run -t "shows login error"`
- Single file + single test name:
- `npx vitest run src/pages/auth/LoginPage.test.jsx -t "submits valid credentials"`
- Single suite in watch mode:
- `npx vitest src/components/common/Table.test.jsx`

## Development Workflow for Agents

- Prefer small, module-scoped changes (page + shared component + API call if needed).
- Preserve existing route naming and module-key conventions used by backend-driven menus.
- Keep UI behavior aligned with backend permission/data-scope responses.
- If behavior changes, add/update tests near the changed component/page.
- Run at least `npm run lint` and `npm run build` before finishing.

## Code Style Guidelines

### Imports

- Keep imports grouped and stable: external packages first, then internal modules, then styles.
- Use relative paths consistent with current file patterns.
- Remove unused imports; ESLint is configured to fail on unused vars/imports.

### Formatting and structure

- Match existing JSX/JS style in surrounding files.
- Prefer clear, readable component structure over dense inline logic.
- Use early returns for loading/error guards.
- Keep components focused; extract reusable logic to hooks/helpers when repeated.

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
- File names: follow existing convention (`PageName.jsx`, `fieldName.js`).

### Routing and auth

- Register routes in `src/App.jsx` using existing protected route flow.
- Keep login redirect and fallback route behavior consistent.
- Do not bypass auth checks for protected pages.
- Keep module-key-to-page resolution compatible with backend `/modules` response.

### API integration

- Use `src/api/axiosInstance.js` instead of creating ad-hoc axios clients.
- Keep token handling centralized in interceptors.
- Handle API failures with user-friendly messages; avoid leaking raw backend internals.
- Avoid hardcoding API URLs; use `import.meta.env.VITE_API_URL`.

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
- Do not store sensitive data in `localStorage` beyond existing auth needs.
- Sanitize/validate user input before sending requests when practical.

### Local agent artifacts

- Keep local agent cache files out of source control (`.agents/`, `skills-lock.json`).
- If working on multiple machines, sync these artifacts privately (or reinstall locally) rather than committing them.

## Testing Guidance

- Use Vitest + Testing Library for UI and interaction tests.
- Co-locate tests with components/pages when practical.
- Focus assertions on behavior (rendered output, interactions, API side effects).
- For auth-sensitive pages, test both authenticated and unauthenticated flows.
- For table/forms, test validation and key edge cases.

## Definition of Done (for agent changes)

- Code compiles and builds (`npm run build`).
- Lint passes (`npm run lint`).
- Relevant tests pass (`npx vitest run` or targeted single-test commands).
- Routing/auth behavior remains consistent.
- No secrets added; environment-driven config preserved.
