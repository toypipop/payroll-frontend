# Payroll Frontend

## Purpose and Scope

React application for payroll administration, attendance, salary history, payroll cycles, reports, and employee payslips. The API and payroll calculations belong to [payroll-backend](../payroll-backend/README.md); edge hosting belongs to [infra](../infra/README.md).

## Requirements and Versions

- [package.json](package.json) declares React 19, Vite 7, TypeScript 6 and Tailwind 4 dependency ranges; package-lock.json records resolved versions.
- Use Node.js 24 to match the [Docker build](Dockerfile). No local Node/npm engine range is declared in package.json.
- Docker preparation pins npm 12.2.0; the runtime pins Nginx 1.30.5 by image digest. Only the pinned esbuild install script is approved in package.json.
- A running backend is required for login and dynamic pages; the local proxy defaults to http://localhost:8000.

## Installation and Configuration

Run from payroll-frontend in PowerShell. Copy the template only on first setup:

~~~powershell
Copy-Item .env.local.example .env
npm.cmd ci
~~~

Keep VITE_API_URL=/api/v1 in every environment. API_PROXY_TARGET selects the local backend target; [vite.config.js](vite.config.js) proxies /api. Never commit .env or secrets. On Linux/macOS use cp instead of Copy-Item and npm instead of npm.cmd.

## How to Run

~~~powershell
npm.cmd run dev
~~~

Open http://localhost:5174 (configured development port). Verify that the login page loads; with the backend ready, verify login and module navigation. The production build is served through [nginx.conf](nginx.conf), which proxies API requests to the backend. The companion backend owns the local full-stack Compose setup.

## Core Business Logic

- The server authenticates with an httpOnly auth_token cookie. AuthProvider exposes the signed-in user; module capabilities drive dynamic navigation and permission controls. Dashboard and My Payslips are universal pages.
- An employee's owning company determines payroll ownership; extra company access grants application access. Forms preserve the existing company on edits and cascade related employee selections by company.
- Attendance and leave feed payroll. Only pending leave requests can be edited; a time-log end at or before its start represents an overnight shift. Business dates and times use Asia/Bangkok.
- Salary history is date-effective. Changes require a reason and audit trail; edits round-trip the record version. Stale edits (412) require reload, while correctable conflicts (409) keep the draft available.
- Bulk salary changes require preview before all-or-nothing apply. Payroll transaction figures come from the last server run; open cycles may be stale and are not recalculated in the browser.

## Verification and Useful References

Run from this repository:

~~~powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
~~~

See [AGENTS.md](AGENTS.md) for change boundaries, [DESIGN.md](DESIGN.md) for existing visual conventions, and [UX-CONTRACT.md](UX-CONTRACT.md) for validation and audit-display behavior. Existing reports under docs/ remain supporting references; no documentation index is required.
