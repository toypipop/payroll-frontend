# Pending Security Tasks

Primary repo: `payroll-frontend`. Related repos: `../payroll-backend`, `../infra`.

## Discussion Topics

### UAT-D11: Company Ownership and Related References

- Status: Awaiting discussion.
- Related task/modules: UAT-01 item 11; employee/company ownership and employee-linked forms.
- Scope: guide testing with disposable UAT records; no production changes, deployment, or implementation authorized.
- Latest decision: user confirmed item 10 is satisfactory and requested item 11 on 19 October 2026. Item 10 is removed from the pending checklist; this confirmation does not establish remote push/deployment details.
- Next step: verify existing-record company selectors are locked, new-record company changes clear incompatible selections, and the API rejects forged cross-company employee/work-location references without changing data.
- UI results: user confirmed all three UI checks pass: immutable company on edit, company-scoped employee/location options, and clearing incompatible selections on company change.
- Console testing: user requested pasteable JavaScript in chat for Browser Console, with no script file in the repository. The previously created helper file was removed at the user's request. User-reported Time Log PUT results are recorded below.
- API results: user reported all three Time Log PUT checks PASS on UAT: immutable company HTTP 400, foreign employee HTTP 403, foreign work location HTTP 400; unchanged=true for every check. The earlier not-found ID stopped before any writes and does not establish the company of that ID.
- Awaiting: remaining item 11 coverage (CREATE and other applicable modules) has not been verified; do not infer a full item pass from Time Log PUT checks.

### UAT-D13: Cross-Module Validation

- Status: Discussing.
- Related task/modules: UAT-01 item 13; required fields, text bounds, numeric precision and Bangkok dates across changed modules.
- Company UI results: user reports all proposed invalid cases trigger validation: blank/whitespace name, address shorter than five characters, tax ID not exactly thirteen digits or containing letters, and invalid phone length/characters. Draft retention and exact feedback were not separately confirmed.
- Next step: Employees create-form checks for required names, code length 2-100, email format/150-character bound, password length 6-30, required department/position/role, and optional account-name/account-number bounds 200/50. Use invalid drafts; do not save real employees.
- Employee UI results: user confirms code, required names, password and required selects behave correctly. Email rejects invalid input but reportedly shows only Invalid rather than the 150-character bound. Account name/account number reportedly show no validation.
- Confirmed code finding: account_name/account_no have schema limits (200/50), but their rendered controls omit errors.account_name/errors.account_no. Account number also updates through setValue without shouldValidate and has a no-op blur handler; visible feedback is not wired. Backend profile validation enforces the same length bounds. No evidence yet that oversized values persist.
- Email investigation: current fieldValidation.ts checks the 150-code-point limit before format. A local Zod reproduction reports the length-specific issue first for oversized input; the reported UAT-only generic message is not yet reproduced against the deployed application. Need exact trimmed character count and deployed revision/UI evidence without collecting the actual email.
- Investigation verification: existing fieldValidation and EmployeeFormModal suites passed (2 files, 15 tests). These existing tests do not cover visible bank-field length feedback and do not establish the deployed email behavior.
- Email follow-up resolved: user confirms the oversized email triggers validation after Save; current onSubmit timing explains the earlier absence of a warning while typing. No email fix is currently established. User still reports Account Name does not display validation after Save. Confirmed cause: the Account Name InputField omits error={errors.account_name?.message}, although its schema rejects more than 200 trimmed Unicode code points. Account number has the same missing error prop in code, but latest user message does not explicitly confirm its retest result.
- Corrective work: wired Account Name and Account Number schema errors into the existing field controls. Email behavior unchanged. Added two regression cases proving visible length errors, retained drafts, no API calls for invalid input, and successful save at the exact 200/50 limits. Both tests failed for missing messages before the fix and passed afterward. Full frontend suite passed: 30 files, 209 tests. No backend/API changes.
- Verification: npm.cmd test passed (209 tests); npm.cmd run typecheck, npm.cmd run lint and npm.cmd run build passed. git diff --check passed. No live browser/UAT retest performed.
- Delivery: user authorized committing the bank-field error display fix, regression tests and updated UAT tracking; included in this commit. Push and deployment are not performed.
- Commit state: bank-field error display fix, regression tests and UAT tracking committed. The initial commit succeeded on retry without changing permissions/configuration; subsequent attempts to amend tracker status timed out twice, so reviewer reliability remains unresolved.
- Account Number follow-up: user reports it does not revalidate while editing like Account Name. Reproduced: the existing setValue/no-op blur integration leaves errors stale after a failed submit. Replaced it with Controller forwarding value, change, blur, ref and name; removed the redundant account_no page-level watch. Validation timing now matches Account Name (first submit, then edits), retaining draft input and leading zeroes.
- Regression: expanded both bank-field tests to correct an oversized value, require the error to clear before another submit, reintroduce the error while typing and recover at the exact limit. Account Number failed before the fix; full suite passed afterward (209 tests). Typecheck, lint, build and git diff --check passed for this follow-up. No live browser/UAT retest performed. User authorized committing this follow-up with its regression test and tracker update; included in this commit. Push/deployment not performed.
- Awaiting: push/deployment instructions and UAT retest of bank-field errors; subsequent API/numeric/date checks remain pending. Company UI rejection alone does not establish all-module validation or database enforcement.

## Agreed Tasks

### UAT-01: Verify Security and Data Integrity Changes on UAT

- Category/status: Verification / In progress (discussion); UAT results pending.
- Repos: payroll-frontend, payroll-backend, infra. Modules are listed below.
- Approved scope: retain original checklist items 4–20 and guide the user through them individually. This authorizes tracking and discussion, not deployment, resetting data, or additional code changes.
- Constraints: use test accounts/data. Backup and ongoing upstream-update monitoring are excluded. Items 1–3 are outside this requested checklist; no pass result is inferred for them.
- Acceptance: each retained item has an explicit observed result against its expected behavior. Record failures with reproduction details before agreeing corrective work. Remove completed checklist entries after reporting results; retain original numbering for remaining items.
- Verification evidence: local automated tests previously passed; the following UAT checks have not yet been confirmed by the user.
- Delivery state: existing implementation commits are frontend a963cef, backend 7d4240a, infra 916e555. The earlier permission-specific audit correction was committed as 6c118d1. The locally verified generic JSON follow-up is included in this commit. Remote push/deploy status is unverified; the audit correction has not been deployed by the agent.

| Item | Module/topic | Expected behavior to verify | Status |
| --- | --- | --- | --- |
| 11 | Company and related IDs | Company cannot be changed on existing records; employee and work_location_id references cannot cross the allowed company relationship. | UI passed; Time Log PUT guards passed (400/403/400, unchanged=true); CREATE/other modules unverified |
| 13 | Validation across changed modules | Required values, lengths, numeric bounds/precision and dates agree between frontend/API/database enforcement; invalid data is not saved. | Company UI invalid-input checks passed; employee/API/numeric/date coverage pending |
| 14 | Leave and attendance | Leave types/annual limits validate correctly; only pending leave requests are editable; overnight shifts and Bangkok times behave correctly. | Pending |
| 15 | Salary history | Create/edit/delete require a reason and audit; concurrent stale edits prompt reload rather than overwriting newer data. | Pending |
| 16 | Bulk salary / payroll | Preview and apply agree; blocked/invalid operations do not partially commit; closed cycles remain protected and reports use snapshots. | Pending |
| 17 | Cycle references / adjustments | Mismatched cycle_id or related records are rejected; valid earning/deduction creation and editing continue to work. | Pending |
| 18 | Error handling | Validation/business conflicts preserve form input and leave the form open with an actionable message. | Pending |
| 19 | Logs / audit | Login failures, password/permission changes and errors do not expose passwords/tokens/cookies/raw payloads in application logs; audits retain useful actor/change metadata. Nginx native error-log limitations remain as documented. | Pending |
| 20 | Proxy / TLS / containers | HTTPS/security headers and API proxy work; backend is not publicly exposed directly; authorized restart checks preserve PostgreSQL data and application operation. | Pending |

- Next step: guide item 13 validation checks in small groups. Keep the unverified remainder of item 11 pending.

### ENV-01: Approval Reviewer Reliability

- Category/status: Tooling / In progress.
- Approved scope: diagnose and restore reliable agent commit approval without disabling sandbox protections or requiring the user to run Git.
- Evidence: effective session uses on-request with auto_review. Earlier review requests failed with model capacity errors. Commit 7ce196c succeeded through the same approval route without any config/permission changes; two later tracker-only amend requests timed out before execution.
- Current state: application fix/tests are committed; tracker status updates remain uncommitted. Push/deployment not performed. No safety configuration or ACL changes made.
- Next step: user-controlled supported permissions-mode review or service recovery; no further repeated escalation attempts in this turn after the permitted timeout retry.
