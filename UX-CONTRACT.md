# Validation workflows

- Zod schemas own client validation; React Hook Form owns draft values, field errors and submission state. Feature modals reseed from `editing` when opened.
- `src/utils/fieldValidation.ts` owns Unicode text counting and common profile constraints. Maximum lengths match backend validation and the corresponding PostgreSQL columns. Count code points rather than UTF-16 units or bytes.
- Required names are trimmed before validation and submission. Free-form time-log notes and leave reasons preserve their whitespace. Optional fields retain their existing empty-value behavior.
- Field failures appear through the existing field primitives. In the master/profile modals updated by this audit, safe API failures appear through `FormError`; the modal stays open and preserves the draft. Disable save during a pending submission.
- `src/utils/bangkokTime.ts` owns business calendar operations. New leave requests and edits send bare `YYYY-MM-DD` dates. Leave spans include both endpoints and must fit the database numeric capacity.
- Salary amounts must fit decimal(15,2). Bulk results outside that capacity block the whole batch; preview and apply retain the same server-enforced rules.
- `SelectField`, `DateField` and `Modal` remain the canonical controls. This validation task does not replace their interaction implementations or change permission/company scoping.

Legacy flows outside the audited modals may still use older feedback patterns; this contract does not claim they have been migrated.

## Audit details

- `AuditLogDetailsModal` owns the read-only audit dialog through the shared `Modal` and `Button` primitives. Scalar event snapshots keep their existing before/after layout.
- `PermissionAuditDetails` compares stored permission snapshots by module ID and shows only changed action/scope values. It never fetches current permissions or current names to reconstruct historical facts. Existing snapshots contain module IDs, so labels use `Module #ID`.
- Configured-module counts include rows with all actions disabled. Missing legacy detail, malformed detail, an explicitly empty list and an absent module grant are distinct states; none is silently interpreted as permission denial or no change.
- Comparison tables use semantic captions and row/column headers, existing tokens and wrapping cells. The shared modal owns vertical scrolling; no additional fetch/loading state is introduced.
