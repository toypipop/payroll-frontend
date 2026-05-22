# Payroll Pro TestSprite PRD

## Product Summary

Payroll Pro is a React + Vite frontend for managing payroll, attendance, employees, company settings, role permissions, and statutory reports. The app is backed by the Go/Gin API in `../payroll-backend` and uses httpOnly cookie authentication.

## Local Test Targets

- Frontend URL: `http://localhost:5174`
- Backend URL: `http://localhost:8000/api/v1`
- Auth mode: Basic login form, backed by httpOnly cookie JWT
- Login endpoint: `POST /api/v1/auth/login`
- Session check endpoint: `GET /api/v1/auth/me`
- Logout endpoint: `POST /api/v1/auth/logout`

## Seed Test Accounts

Use seeded local/test data only.

- System admin: `admin@admin.com` / `password123`
- Staff account: `staff@admin.com` / `password123`
- Company A manager: `alice@techa.com` / `password123`
- Company B manager: `david@bizgroup.com` / `password123`

## Core Requirements

1. Users can sign in with seeded credentials and are redirected to the dashboard.
2. Invalid credentials show a visible login error and do not create an authenticated session.
3. Protected pages redirect unauthenticated users to `/login`.
4. Navigation is driven by backend `/modules`; clickable modules must open matching frontend pages.
5. Sidebar categories group modules and non-category pages use backend `route_path`.
6. Forms display explicit loading, empty, validation, and server-error states.
7. Company-scoped workflows use `GET /companies/options` for company dropdowns.
8. Employee-linked forms cascade company to dependent options and reject employee/company mismatches.
9. Time Logs cascade company to employee to work location.
10. Time Logs auto-fill check-in and check-out from attendance settings, including overnight shifts.
11. Leave Request selects validate immediately after company, employee, or leave type selection.
12. Only pending leave requests are editable.
13. Payroll run pages calculate and display payroll transactions for a selected cycle.
14. Report previews for payslips, bank transfer, tax forms, and SSO open as full-screen portal modals outside page cards.
15. Report print layouts should remain printable and not clipped on A4-style document views.

## Primary UI Flows To Test

1. Login and logout.
2. Dashboard access after login.
3. Backend-driven navigation through each sidebar category.
4. Company, department, position, role, and employment type CRUD pages.
5. Employee creation/editing with company-scoped dependent fields.
6. Employee company access mapping and default company behavior.
7. Attendance settings and time log creation/editing, including overnight checkout.
8. Leave request creation, validation, approval state behavior, and deletion.
9. Payroll cycle setup, cycle earnings/deductions, run payroll, and transactions table.
10. Reports: payslips, bank transfer, payroll analysis, SSO, PND.1, and 50 Tawi previews.

## API/Contract Risks

- Frontend route registration depends on `/modules` response shape and `module_key` matching page filenames exactly.
- Cookie auth must work with credentialed CORS between `localhost:5174` and `localhost:8000`.
- `GET /companies` is intentionally not supported; only `/companies/options` and `/companies/all` are valid for their respective use cases.
- Payroll category APIs are `/master/earning-categories` and `/master/deduction-categories`.
- The frontend should not store JWTs or send manual bearer tokens.

## Acceptance Criteria

- All seeded login accounts with expected permissions can access their allowed modules.
- Unauthorized or unauthenticated users cannot access protected routes.
- CRUD flows preserve company scoping and show meaningful validation/server errors.
- Tables support search/sort where applicable and command-only columns are not sorted.
- Full-screen print preview modals lock background scroll and close cleanly.
- No console crashes occur during normal navigation, form submission, preview opening, or logout.
