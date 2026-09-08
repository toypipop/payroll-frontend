# Audit Log design

## Purpose

Add one append-only audit trail for meaningful, successful business changes. It answers who changed which record, when, under which company, and why when the flow requires a reason. It replaces the specialised SalaryAudit trail after its history is migrated.

Audit Log is separate from technical logging. It does not record every request, password, token, cookie, raw request body, or failed/denied attempt.

## Access policy

Audit Log visibility uses the same module capability and permission matrix as every other module; it never branches on a role name.

- `AuditLogsPage` supports only `VIEW`, with `Companies` and `All` data scopes.
- A role with `All` can read all audit entries.
- A role with `Companies` can read entries whose `company_id` belongs to its accessible company set.
- A role without `VIEW` cannot access the Audit Logs module or API.
- Seed grants System Admin `VIEW + All` and Company Admin `VIEW + Companies`; administrators can change either grant in the Permission Matrix.
- Entries are immutable: no create, update, or delete endpoint exists for clients.

## Data model

The backend adds one `audit_log` table and a matching `models.AuditLog` model.

| Field | Purpose |
|---|---|
| `id` | Primary key |
| `occurred_at` | Bangkok business timestamp when the transaction changed data |
| `actor_user_id` | User who initiated the action; nullable only for controlled system actions |
| `actor_name_snapshot` | Display name at event time |
| `company_id` | Tenant ownership and Company Admin scope |
| `event_type` | Closed, namespaced value such as `leave_request.approved` |
| `entity_type` | Stable resource name such as `leave_request` |
| `entity_id` | Changed resource identifier |
| `summary` | Short server-generated description; never contains sensitive fields |
| `reason` | Required only for flows that already require one, such as salary changes |
| `before_data` | JSONB allowlisted changed values before mutation |
| `after_data` | JSONB allowlisted changed values after mutation |
| `created_at` | Database timestamp for operational ordering |

Indexes: `(company_id, occurred_at DESC)`, `(entity_type, entity_id, occurred_at DESC)`, and `(actor_user_id, occurred_at DESC)`.

## Event catalogue

The first release records successful events only.

| Domain | Events |
|---|---|
| Company | `company.created`, `company.updated`, `company.activated`, `company.deactivated` |
| Access control | `role.created`, `role.updated`, `role.deleted`, `permission.updated` |
| Employee | `employee.created`, `employee.updated`, `employee.deleted` |
| Payroll | `payroll_cycle.created`, `payroll_cycle.updated`, `payroll_cycle.closed`, `payroll_run.completed` |
| Attendance | `time_log.created`, `time_log.updated`, `time_log.deleted`, `leave_request.created`, `leave_request.updated`, `leave_request.approved`, `leave_request.rejected` |
| Master settings | Successful create, update, and delete of leave types, departments, positions, earning types, deduction types, holidays, and work locations |
| Salary | `salary.created`, `salary.amount_changed`, `salary.moved`, `salary.deactivated`, `salary.deleted` |

Denied requests, quota conflicts, inactive-company attempts, and permission failures remain safe technical logs only. They are not audit events because no business state changed.

## Write path and integrity

1. A service validates and authorizes the business command.
2. The service reads the minimum allowlisted before-state needed for the event.
3. The business mutation and `AuditLogRepository.Append` run inside the same database transaction.
4. Failure to append the audit entry rolls back the business mutation.
5. The audit service serializes only allowlisted fields, preventing passwords, credentials, tokens, cookies, and raw request bodies from entering JSONB.

The audit service owns event construction. Handlers pass request scope and validated command data; repositories do not infer actors from HTTP context.

## SalaryAudit migration

`SalaryAudit` is replaced rather than maintained in parallel:

1. Add AuditLog alongside the existing salary audit table.
2. Backfill each SalaryAudit row into its equivalent `salary.*` event, retaining actor snapshot, reason, effective date, and safe amount metadata.
3. Change salary history reads and all salary write paths to use AuditLog.
4. Verify backfill counts and samples before removing the old SalaryAudit model/table in a later migration.

The old table is not dropped in the first deploy, which gives a rollback path and prevents accidental loss of payroll history.

## Read API and UI

The backend exposes a scoped, read-only list endpoint supporting company, event type, actor, entity type, and Bangkok date-range filters with cursor pagination.

The frontend adds an Audit Logs module after the write path is complete. The API returns the caller's effective scope; the UI exposes a company selector only when that scope permits it. The UI provides filters, paginated rows, and a detail view of allowlisted before/after fields. It has no edit or delete controls.

## Verification

- Unit tests for event construction and field allowlists.
- Repository integration tests proving append and business mutation commit or roll back together.
- Scope tests for System Admin and Company Admin queries.
- SalaryAudit backfill tests for count and representative event mapping.
- Frontend tests for filter state and scoped display once the module is added.
- Run backend `go test ./...`, `go vet ./...`, and `go build ./...`; frontend `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build`.
