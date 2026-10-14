# Pending Security Tasks

Primary repo: `payroll-frontend`. Related repos: `../payroll-backend`, `../infra`.

## Discussion Topics

### UAT-D10: Permission Save Refresh and Audit

- Status: Discussing.
- Related task/modules: UAT-01; permission matrix and permission audit.
- Current agreement: discuss and verify the remaining checklist items one at a time. Do not infer a UAT pass from local tests or advancing the discussion.
- Next step: as admin, edit the unused UAT Salary Scope role. Keep salary VIEW enabled; toggle EDIT and save, then switch scope between Own and Department and save again. Verify the reloaded matrix and a later re-selection match saved values. Repeat consecutive completed saves and inspect permission audit before/after grant details.
- Current results: user reports permission saving/reloading and consecutive saves work. Audit shows permission_count 39 but permissions as a dash. Backend PermissionAuditData counts persisted module permission rows (including disabled grants); the frontend snapshot formatter displays non-scalar values as a dash, so it cannot render the permissions array.
- Correction approved: inspect and fix audit display, with relevant tests. Frontend currently renders the permissions array as a dash; retain historical snapshot values rather than reconstructing them from current permissions. Clarify the count label and show meaningful before/after permission details.
- Required skills resolved: user authorized installation of Superpowers; all 15 skills were installed from obra/superpowers into the global Codex skills directory. Systematic debugging, TDD, verification and Frontend Design guidance are applied.
- Implementation verified locally: snapshot-only permission comparison, clearer configured-module count, changed action/scope values and explicit legacy/invalid states added. Module IDs are used because historical snapshots do not store module names. Regression tests failed on the original UI and pass after the fix. Typecheck, lint, build and all 209 unit tests passed. Headless browser verification passed on desktop/mobile with synthetic current/legacy/invalid/empty/39-module snapshots, keyboard Close/Escape and scroll checks; no browser errors.
- Verification limitation: the skill-required broader product audit in strict mode reports three pre-existing findings outside this fix (SelectField native ownership, LoginPage noValidate, global scrollbar standards properties). No full-product UI compliance is claimed. Evidence: ignored tmp/security-validation/audit-ui-baseline.json. No API/database changes or migration are needed for the display fix.
- Awaiting: deployment and UAT confirmation of item 10. Implementation and local verification are complete. No production role changes or reassignment of Carol are needed.

## Agreed Tasks

### UAT-01: Verify Security and Data Integrity Changes on UAT

- Category/status: Verification / In progress (discussion); UAT results pending.
- Repos: payroll-frontend, payroll-backend, infra. Modules are listed below.
- Approved scope: retain original checklist items 4–20 and guide the user through them individually. This authorizes tracking and discussion, not deployment, resetting data, or additional code changes.
- Constraints: use test accounts/data. Backup and ongoing upstream-update monitoring are excluded. Items 1–3 are outside this requested checklist; no pass result is inferred for them.
- Acceptance: each retained item has an explicit observed result against its expected behavior. Record failures with reproduction details before agreeing corrective work. Remove completed checklist entries after reporting results; retain original numbering for remaining items.
- Verification evidence: local automated tests previously passed; the following UAT checks have not yet been confirmed by the user.
- Delivery state: existing implementation commits are frontend a963cef, backend 7d4240a, infra 916e555. The audit display correction and tracking updates are included in this frontend commit, authorized by the user. Remote push/deploy status is unverified; the audit correction has not been deployed by the agent.

| Item | Module/topic | Expected behavior to verify | Status |
| --- | --- | --- | --- |
| 10 | Permission updates | UI reloads updated permissions correctly; rapid repeated permission saves succeed and audit records preserve before/after grants. | Save/refresh passed; audit display fix locally verified; UAT confirmation pending |
| 11 | Company and related IDs | Company cannot be changed on existing records; employee and work_location_id references cannot cross the allowed company relationship. | Pending |
| 12 | Company creation | Required initial company data is created and usable; client-supplied extra fields cannot override server-controlled initialization. | Pending |
| 13 | Validation across changed modules | Required values, lengths, numeric bounds/precision and dates agree between frontend/API/database enforcement; invalid data is not saved. | Pending |
| 14 | Leave and attendance | Leave types/annual limits validate correctly; only pending leave requests are editable; overnight shifts and Bangkok times behave correctly. | Pending |
| 15 | Salary history | Create/edit/delete require a reason and audit; concurrent stale edits prompt reload rather than overwriting newer data. | Pending |
| 16 | Bulk salary / payroll | Preview and apply agree; blocked/invalid operations do not partially commit; closed cycles remain protected and reports use snapshots. | Pending |
| 17 | Cycle references / adjustments | Mismatched cycle_id or related records are rejected; valid earning/deduction creation and editing continue to work. | Pending |
| 18 | Error handling | Validation/business conflicts preserve form input and leave the form open with an actionable message. | Pending |
| 19 | Logs / audit | Login failures, password/permission changes and errors do not expose passwords/tokens/cookies/raw payloads in application logs; audits retain useful actor/change metadata. Nginx native error-log limitations remain as documented. | Pending |
| 20 | Proxy / TLS / containers | HTTPS/security headers and API proxy work; backend is not publicly exposed directly; authorized restart checks preserve PostgreSQL data and application operation. | Pending |

- Next step: deploy the committed frontend audit correction through the authorized workflow, then obtain UAT confirmation of audit display before discussing item 11. Deployment remains a user-controlled step.
