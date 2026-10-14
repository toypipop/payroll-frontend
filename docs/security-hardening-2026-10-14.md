# Security remediation — 2026-10-14

Scope: approved repository changes; verification was completed before committing. No push, deployment, VPS configuration or production data access was performed. The user dropped backup work on 2026-10-14 because this is an example project; backup scripts, tests, CI and documentation were removed.

## Implemented

1. **Secrets:** ignore environment variants, private keys and backups while allowing templates. All three repos have redacted Gitleaks CI scans covering full history. Docker exclusions remain; the edge build context includes only its Dockerfile.
2. **Images:** pin supported base digests, refresh OS packages, update both Nginx images to 1.30.5, and build patched PostgreSQL 17.11 without changing its major version or volume. Patch npm 12.2.0 bundled tools independently of the application lockfile. Manual deploy workflows rebuild with `--pull --no-cache`. Offline CI scans do not upload private images/SBOMs.
3. **Logs/audit:** frontend diagnostics allow only static operations, known codes, status and validated request IDs. Backend request/error/database/recovery logs omit raw errors, SQL, payloads, headers, URL parameters and panic values. Audit validation traverses nested/typed collections. Permission before/after grants are recorded atomically; password changes record safe metadata only. Nginx access logs omit URLs/query strings; Compose rotates logs.

Integration exposed a same-second permission soft-delete uniqueness collision. Role permission tombstones now use nanoseconds. The existing bigint column supports this without a migration or rewriting old tombstones. Permission writes and audit remain atomic.

## Verification

- Frontend: typecheck, lint, build and all 204 tests passed. Patched Docker build completed npm ci/build; application npm audit reported zero findings.
- Backend: full Go tests, vet and build passed in Linux Docker, including safe logging, nested audit guards, transactional permission audit, password metadata and tombstones. Linux verification replaced a Windows binary blocked by Application Control; host policy was unchanged. Source govulncheck found no vulnerable calls/imported packages; one unused-module advisory remains.
- Isolated containers: PostgreSQL persistence/recreation, migrations/mock seeds, cookie login/me, permission saves/audit, password audit, SPA/API proxy, HTTPS/ACME, headers and runtime permissions passed. Synthetic cookie/password/query sentinels were absent from captured application/access logs.
- Workflow YAML and shell syntax validated. Redacted Gitleaks checks of current files and locally available Git histories found no secrets.

## Image results and limits

Offline Trivy 0.75.0 used public advisory data available on 2026-10-14. Results can change with vendor assessments/database updates.

| Image | Result |
| --- | --- |
| Frontend and edge Nginx runtimes | Zero reported vulnerabilities |
| Backend runtime | Zero OS findings; unused OpenPGP module metadata remains |
| PostgreSQL runtime | Zero fixable high/critical OS findings; vendor-unfixed OS and gosu metadata remain |
| Frontend build stage | One high-severity unfixed http-cache-semantics finding |

PostgreSQL has 313 OS package/advisory records: 138 low, 109 medium, 61 high, 4 unknown and 1 critical, all without vendor fixes in the scanned database. The critical entry is CVE-2026-6653 in libxml2. Counts are advisory records, not confirmed application exploit paths. Its gosu helper also has old Go dependency metadata; local binary govulncheck found zero vulnerable symbol calls, but imported/module-level findings remain. This is limited reachability evidence, not proof of no risk.

The frontend build finding is CVE-2026-93748 in npm's bundled http-cache-semantics 4.2.0, with no fixed version reported. The build stage is not shipped in the runtime image.

CI rejects fixable high/critical OS findings; frontend build also checks libraries. Full reports retain unfixed findings. Upstream follow-up remains in TASKS.md.

Nginx access logs are sanitized. Native Nginx error logs retain standard diagnostics and can include request details on errors; access-log tests do not prove every native error path is redacted. Avoid credentials in URLs and restrict operational log access.

VPS secrets and running digests remain unverified. Backup/recovery is excluded by the user's decision for this example project. For any later authorized image deployment, check PostgreSQL collation compatibility; do not reset volumes or automatically REINDEX.
