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

### UAT-D16: Bulk Salary and Payroll

- Status: Discussing.
- Related task/modules: UAT-01 item 16; bulk salary preview/apply, atomicity, closed-cycle protections and report snapshots.
- Scope: guide user-run UAT with disposable employees, salary data and an open test cycle. No agent-run mutations, cycle closure, recalculation or deployment authorized.
- Latest checkpoint: user confirmed item 15 required reasons, matching audits, and stale-tab protection. Provided Salary Created audit shows reason and stored salary/effective-date snapshot. Stale-tab result establishes observed lost-update protection, not a complete ACID/isolation audit; no exact HTTP status was supplied by the user.
- Next step: preview a raise for two test employees; compare eligible amounts and blocked reasons, verify Apply is disabled when any row is blocked, and confirm preview alone does not mutate salary history. Then verify all-or-nothing apply and closed-cycle/report behavior in separate controlled steps.
- Approved UI changes: user requested feedback when Preview is clicked with no selected employees, and a clearable company filter showing all accessible employees. Added existing FormError feedback and an explicit All companies empty-value option using SelectField; existing company-change logic clears selection/preview, and inactive employees remain excluded.
- Regression verification: two new component tests failed before implementation and passed afterward; verify warning visibility/clearance with no POST and restoration of accessible active employee options with cleared selections and no extra fetch. Full verification passed: 31 test files/211 tests, typecheck, lint, build and git diff --check. No live browser/UAT verification performed; not committed or deployed. No backend, permission, or API contract changes.
- Copy follow-up: user requested the manual salary field warning Enter salary and the batch warning Each selected employee needs a new salary. Updated only those two literals; validation rules unchanged. Verified exact text and diff whitespace; no additional tests run for this copy-only follow-up.
- UAT 16.1: user confirms Preview figures are correct. Preview-only persistence/no-write behavior has not been separately confirmed.
- Awaiting: verify preview does not change stored history; blocked-row feedback/disabled Apply; successful batch matches preview; backend all-or-nothing failure behavior; closed-cycle protection and report snapshots. No full atomicity claim from a disabled Apply button alone.

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
| 16 | Bulk salary / payroll | Preview and apply agree; blocked/invalid operations do not partially commit; closed cycles remain protected and reports use snapshots. | 16.1 Preview figures confirmed; persistence/blocked/apply/closed-cycle/snapshot checks pending |
| 17 | Cycle references / adjustments | Mismatched cycle_id or related records are rejected; valid earning/deduction creation and editing continue to work. | Pending |
| 18 | Error handling | Validation/business conflicts preserve form input and leave the form open with an actionable message. | Pending |
| 19 | Logs / audit | Login failures, password/permission changes and errors do not expose passwords/tokens/cookies/raw payloads in application logs; audits retain useful actor/change metadata. Nginx native error-log limitations remain as documented. | Pending |
| 20 | Proxy / TLS / containers | HTTPS/security headers and API proxy work; backend is not publicly exposed directly; authorized restart checks preserve PostgreSQL data and application operation. | Pending |

- Next step: guide item 16 bulk salary and payroll checks. Keep the unverified remainder of item 11 pending.

### ENV-01: Approval Reviewer Reliability

- Category/status: Tooling / In progress.
- Approved scope: diagnose and restore reliable agent commit approval without disabling sandbox protections or requiring the user to run Git.
- Evidence: effective session uses on-request with auto_review. Earlier review requests failed with model capacity errors. Commit 7ce196c succeeded through the same approval route without any config/permission changes; two later tracker-only amend requests timed out before execution.
- Current state: application fix/tests are committed; tracker status updates remain uncommitted. Push/deployment not performed. No safety configuration or ACL changes made.
- Next step: user-controlled supported permissions-mode review or service recovery; no further repeated escalation attempts in this turn after the permitted timeout retry.
