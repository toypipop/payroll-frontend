# Help Center — Design Spec
**Date:** 2026-06-11  
**Status:** Approved

---

## Overview

An in-app Help Center page that serves as a user manual for all modules in the payroll system. Accessible to all logged-in users, bilingual (Thai + English), and structured as a two-level Card Grid + Modal pattern.

---

## Requirements

| # | Requirement |
|---|---|
| R1 | Requires login — lives inside MainLayout like all other pages |
| R2 | Bilingual: Thai and English, toggled at the page level |
| R3 | Shows all module documentation to all roles (no role-based filtering) |
| R4 | All help content is written and embedded at build time (no API calls) |
| R5 | Backend module seed required — so Help appears in sidebar like all other modules |
| R6 | Backend route uses `AuthMiddleware()` only — no `CheckPermission` (open to all roles) |

---

## Route

```
/help
```

Added as a static hardcoded route in `src/App.tsx`, alongside `/dashboard` and `/my-payslips`. The route itself does not depend on the `/modules` API, but a backend seed entry is required so the module appears in the sidebar.

---

## Architecture

### Components

```
src/pages/help/
  HelpPage.tsx           — top-level page: language toggle + category grid
  HelpModal.tsx          — modal overlay showing one module's detail
  helpContent.ts         — all bilingual content data (typed, no API)
```

### Data Shape (`helpContent.ts`)

```ts
type HelpArticle = {
  id: string
  category: HelpCategory
  titleTH: string
  titleEN: string
  descTH: string
  descEN: string
  stepsTH: string[]
  stepsEN: string[]
  icon: string
}

type HelpCategory =
  | 'employees'
  | 'attendance'
  | 'payroll'
  | 'reports'
  | 'settings'
  | 'payroll-config'
```

### State (in `HelpPage.tsx`)

```ts
lang: 'th' | 'en'                     // language toggle — default 'th'
selectedCategory: HelpCategory | null  // which category is expanded
selectedArticle: HelpArticle | null    // which modal is open
```

No external state management (React useState only).

---

## UI Flow

```
/help (category grid, 3-column)
  └── click category card
        └── module cards for that category appear below
              └── click module card
                    └── modal opens (no navigation)
                          └── close button / click outside → modal closes
```

---

## Page Layout (`HelpPage.tsx`)

### Header
- Left: title "📚 Help Center / คู่มือการใช้งาน"
- Right: language toggle pill `TH | EN`

### Category Grid
6 cards in a 3-column grid:

| Category | Icon | Thai Label | EN Label | Module Count |
|---|---|---|---|---|
| employees | 👥 | พนักงาน | Employees | 4 |
| attendance | 🕐 | การเข้างาน | Attendance | 5 |
| payroll | 💰 | เงินเดือน | Payroll | 6 |
| reports | 📊 | รายงาน | Reports | 5 |
| settings | ⚙️ | การตั้งค่า | Settings | 10 |
| payroll-config | 🔧 | ตั้งค่า Payroll | Payroll Config | 5 |

Clicking a category card shows its module cards below the grid (replaces grid or appends — single selected category at a time).

### Module Cards
- Show module icon + Thai/English title (based on `lang` state)
- Clicking opens the detail modal

---

## Modal (`HelpModal.tsx`)

- **Header:** dark green (`#1a3c34`) background, module title in active language (large), subtitle in other language (small, muted), close button (✕)
- **Body:**
  - Description paragraph
  - "วิธีใช้งาน / How to use" section header
  - Numbered steps in a styled block (left border accent)
- **No language toggle inside modal** — follows parent `lang` state passed as prop
- Close on: ✕ button click, backdrop click, Escape key

---

## Module Content Coverage

### Employees (4 articles)
- Employee List (EmployeesListPage)
- Salary Structure (SalariesStructurePage)
- Employee Earnings (EmployeeEarningsPage)
- Employee Deductions (EmployeeDeductionsPage)

### Attendance (5 articles)
- Time Logs (TimelogsListPage)
- Leave Requests (LeaveRequestsPage)
- Leave Approved (LeaveApprovedPage)
- Earning Summary (EarningSummaryPage)
- Deduction Summary (DeductionSummaryPage)

### Payroll (6 articles)
- Payroll Cycles (PayrollCyclesPage)
- Run Payroll (RunPayrollPage)
- Cycle Earnings (CycleEarningsPage)
- Cycle Deductions (CycleDeductionsPage)
- Transactions (TransactionsPage)
- My Payslips (MyPayslipsPage)

### Reports (5 articles)
- Payroll Analysis (PayrollAnalysisPage)
- Payslips Report (PayslipsReportPage)
- Bank Transfer Report (BankTransferReportPage)
- Tax Forms Report (TaxFormsReportPage)
- SSO Report (SSOReportPage)

### Settings (10 articles)
- Companies (CompaniesPage)
- Departments (DepartmentSettings)
- Positions (PositionSettings)
- Roles (RolesPage)
- Employee Company Access (EmployeeCompanyAccessPage)
- Work Location (WorkLocationPage)
- Day Off (DayOffPage)
- Holiday Calendar (HolidayCalendarPage)
- Master Leave Type (MasterLeaveTypePage)
- Attendance Settings (AttendanceSettingsPage)

### Payroll Config (5 articles)
- Payroll Global Settings (PayrollGlobalSettingsPage)
- Earning Types (EarningTypesPage)
- Deduction Types (DeductionTypesPage)
- Earning Category (EarningCategoryPage)
- Employment Type (EmploymentTypePage)

---

## Styling

- Reuses existing CSS variables and inline style patterns from the codebase (`--shadow-card`, `rgba(255,255,255,0.72)`, `border-radius: 18px`, etc.)
- Primary color: `#1a3c34` (matches app theme)
- Card hover: border color shifts to `#1a3c34`, light green background tint
- Modal backdrop: `rgba(0,0,0,0.4)`
- No new CSS files — inline styles consistent with existing pages

---

## Backend Changes (payroll-backend)

### Module Seed Entry
Add one record to the modules seed table:

| Field | Value |
|---|---|
| module_key | `HelpPage` |
| module_name | `Help Center` |
| route_path | `/help` |
| icon | `HelpOutline` (or nearest available icon in Sidebar.tsx) |
| is_category | false |
| parent_id | null (top-level) |
| order | last in list |

### Route Registration
Add to the backend router:
```go
protected.GET("/help", AuthMiddleware(), helpHandler.GetHelp)
```
No `CheckPermission` middleware — all authenticated users can access.

The handler can return a simple `200 OK` or be omitted entirely (frontend-only page; the route just needs to exist so the sidebar link resolves correctly). Alternatively, the module seed alone is sufficient since `/help` is hardcoded in `App.tsx`.

---

## Out of Scope

- Search functionality
- Role-based content filtering
- Video embeds or screenshots
- Pagination
