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

- All events use the same snapshot renderer in AuditLogDetailsModal; no event/module-specific display branches.
- Show stored before_data and after_data as indented JSON, including nested objects/arrays, false, zero, null and empty strings. Missing snapshots show an explicit message; an empty object remains {}.
- Render JSON as React text, never HTML. Preserve original keys, IDs and timestamp strings; do not fetch live records to reconstruct historical values.
- Backend services own explicit allowed-field snapshots; the existing recursive sensitive-field guard rejects known credential fields before persistence. The UI is not the secrecy boundary.
- Reuse Modal and Button, existing tokens, wrapping monospace text and the modal's vertical scroller. Stack before/after on narrow screens.
