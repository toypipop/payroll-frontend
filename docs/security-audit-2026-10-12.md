# Security Audit: Remaining Four Tasks

Date: 2026-10-12 (Asia/Bangkok). Implementation is awaiting approval.

## Scope and Limits

Reviewed `payroll-frontend`, `../payroll-backend`, and `../infra`: tracked files, all locally available Git refs/history, workflows, environment templates, Docker build/runtime images, logging and representative audit write paths, and repository backup/recovery materials. All three clones are non-shallow.

No application/configuration fix, commit, push, deployment, or VPS operation was performed. Real VPS environment values, daemon logging configuration, running image digests, scheduled backups, off-server storage, and actual backup restorability remain unverified. Findings on locally built or public registry images do not prove the exact image currently running on UAT.

## SEC-01: Secrets and Git Exposure Prevention

### Findings

- Gitleaks scanned the tracked-file snapshots and Git history with `--log-opts=--all` for all three repos, with 100% redaction and network disabled during scanning. No findings: frontend 249 tracked files, backend 259, infra 4. This is a scanner result, not proof that every possible secret is absent.
- Current tracked environment files are templates. Git history contains template names, not an actual `.env` file. No credential-bearing HTTPS remote URLs were detected by the check.
- Frontend and backend Docker ignore rules already exclude `.env` and `.env.*` from build contexts.
- Git ignore protection is incomplete: frontend/backend ignore `.env` but not arbitrary `.env.uat` or `.env.production` files. Infra has no `.gitignore`. Test names were checked using `git check-ignore`; no real secret files were created or printed.
- GitHub workflows use GitHub Secrets rather than embedded credential values. There is no secret-scanning job in the inspected workflows.

### Proposed Fix

Add `.env`/`.env.*` ignore rules to all repos while explicitly allowing committed `.env.*.example` templates. Exclude local private-key and backup artifacts in the appropriate repos. Add a redacted Gitleaks CI check with reviewed exceptions only for synthetic fixtures. Do not rotate credentials or rewrite Git history based solely on these prevention gaps; if real exposure is later established, revoke/rotate first and then assess history cleanup.

### Remaining Remote Facts

Verify VPS `.env`/key permissions and secret handling without sharing secret values. Local history scanning does not cover deleted remote refs, GitHub artifacts, or server files.

## SEC-02: Docker Images and Build Tooling

### Evidence

Built the current frontend/backend Dockerfiles successfully. Scanned their exported archives using Trivy with `--network none`, no Docker socket, an already downloaded vulnerability DB, `--offline-scan`, and telemetry disabled. Only public registry images were sent to Docker Scout.

| Target | Result snapshot |
|---|---|
| Backend runtime, Alpine 3.22.6 | Trivy: one zlib finding plus the previously assessed unused OpenPGP advisory in two Go binaries |
| Frontend runtime, Nginx 1.29.8 / Alpine 3.23.4 | Trivy: 176 package/advisory records, including 43 HIGH; 108 distinct advisory IDs |
| Public frontend Nginx base | Scout: 121 distinct CVE IDs, including 13 classified CRITICAL |
| Public infra `nginx:alpine` | Scout: 18 distinct CVE IDs, including 6 HIGH |
| Public `postgres:17` | Scout: 123 distinct CVE IDs; includes OS libraries and Go metadata from helper binaries |
| Public `node:24-alpine` build stage | Scout: 22 distinct CVE IDs; includes npm-bundled dependencies |
| Public `golang:1.27.2-alpine` build stage | Scout: one zlib CVE |
| Application npm dependencies | Fresh `npm audit --json`: zero findings, including dev dependencies |

Counts and severities differ between tools and advisory sources. They are inventory findings, not counts of independently exploitable application flaws. Package records may repeat one advisory across related packages/binaries. Some advisories have no published fix or are conditional on functionality this system does not use.

Local runtime image IDs:

- Backend: `sha256:6a80f97b854787df1a5592fb26b8ffed8da1e91a5e3b1b63371bd0b8a214061c`
- Frontend: `sha256:9768628638e6759ac9109e12cfe6ae24eb684a71fc990567ae7b8b4e0cf74aa0`

### Actionable Findings

- Backend runtime contains zlib `1.3.2-r0`; the scanner identifies `1.3.2-r1` as fixed for CVE-2026-85091. Scout labels it HIGH while Trivy labels it MEDIUM.
- Frontend contains older OpenSSL libraries, curl/libcurl, PCRE2, expat, and other libraries with fixed versions identified by the scanners. For example, OpenSSL-library fixes reach `3.5.8-r0`, curl `8.22.0-r0`, and PCRE2 `10.49-r0` in the reported Alpine branch. Check availability in the selected distro before applying upgrades.
- The actual frontend binary is Nginx `1.29.8`. Current upstream advisories include later fixes. For example, CVE-2026-42533 is fixed in `1.30.4+` / `1.31.3+`, conditional on map/regex use; CVE-2026-90439 is fixed in `1.30.5+` / `1.31.6+`, conditional on HTTP/3. The inspected configs do not enable those particular features, so this review does not establish their exploitability here.
- Node build-image findings include npm's bundled `brace-expansion`, `tar`, `undici`, and `ip-address`, separate from the project's clean npm audit. Node/npm are not shipped in the final frontend runtime image.
- PostgreSQL-image findings include old Go standard-library metadata in helper binaries and OS packages. A Go metadata finding in a command-line helper does not imply the PostgreSQL server executes the affected network APIs.
- Manual deploy workflows rebuild/recreate but do not explicitly refresh base/runtime images. Cached tags can retain old packages. Tags such as `nginx:alpine` and `postgres:17` also do not identify an immutable deployed artifact.

### Proposed Fix

Refresh to supported patched Nginx/non-root Nginx image releases; use maintained Alpine bases and update fixed distro packages during image build where upstream images lag. Keep backend Go 1.27.2 unless new evidence requires changing it. Update Node build tooling/npm separately from project dependencies, checking compatibility with `npm ci` and the lockfile.

Evaluate a maintained patched PostgreSQL 17 image and its distro/helper findings; keep major version 17 and preserve the data volume. Do not jump PostgreSQL major versions just to reduce scan counts. Unfixed or unreachable advisory cases need documented assessment, not a promise of zero CVEs.

Record tested versions/digests and add scanning to CI. For future manual deployment, explicitly refresh chosen images and build bases before recreation; retain the manual workflow and test web/API/TLS/ACME/healthchecks and database initialization/recreation. See [Docker build pull behavior](https://docs.docker.com/reference/cli/docker/compose/build/) and [Nginx advisories](https://nginx.org/en/security_advisories.html).

## SEC-03: Logging and Audit

### Existing Controls

Backend request logs already include server-generated request ID, status, method, route, path, and duration. HTTP errors use a centralized status mapper and client-safe messages. Invalid login logging does not print the submitted email/password. Audit read access is company/permission scoped and exposes no client mutation endpoint. Business audit events exist across payroll, salary, employee, permission, and master-data operations; representative employee and permission writes append audit within transactions.

### Confirmed or Reproduced Gaps

1. **Frontend raw errors:** `src/pages/auth/LoginPage.tsx` logs the full Axios error. Its request config retains the submitted plaintext password. A synthetic AxiosError probe confirmed this; other raw error/response logging exists in payroll, salary, reports, employees, and attendance flows.
2. **Database/error logs:** `config/database.go` leaves GORM's default logger enabled. Default parameter filtering returns values, and errors/slow queries log expanded SQL. A synthetic failed query reproduced a marker value in the log. `httpx.RespondError` also logs raw internal errors, which can include database detail; safe client responses do not automatically make server logs safe.
3. **Recovery headers:** routes use Gin 1.11.0 `gin.Recovery()`. Gin masks Authorization but not Cookie in request dumps. Release mode's broken-pipe recovery path still dumps the request. A release-mode synthetic broken-pipe panic reproduced a fake `auth_token` cookie in the recovery log; ordinary debug-mode recovery also dumps headers.
4. **Audit detail:** permission updates store only `permission_count`, so equal-count changes do not show which grants/scopes changed. Password changes create generic employee-update audit events without a safe `password_changed` flag, making those actions hard to identify.
5. **Audit guard depth:** `containsSensitiveAuditField` checks nested `map[string]any` but not arrays. A synthetic array containing a password key was accepted. Current callers construct allowlisted audit payloads; no public client audit-write endpoint or current attacker-controlled array-to-audit path was established. This is a defensive guard gap.
6. **Log exposure/retention:** default Nginx request logging includes the query string; the backend request logger records raw paths. Compose files do not set log size/rotation limits. Whether the VPS daemon already supplies rotation is unknown.

### Proposed Fix

Use an allowlisted client diagnostic helper with status/error code/request ID and a fixed operation name; never print Axios config, bodies, or whole response objects. Configure GORM logging to exclude values and sanitize driver detail, and replace raw HTTP error/panic logging with safe structured metadata. Use a recovery handler that avoids request/header dumps and preserves 500 behavior and correlation IDs.

Record safe before/after permission grants/scopes and explicit password-change metadata without passwords/hashes. Extend sensitive-field checks across nested arrays and relevant supported JSON containers, with regression tests. Keep audits and mutations atomic.

Exclude query strings/sensitive paths from operational logs where practical, and set explicit Docker log rotation limits. Preserve useful audit history according to an agreed retention policy. Verify with sentinel password/cookie/SQL/error values that none enter log output.

## SEC-04: Backup, Restore, and Recovery

Scope update (2026-10-14): the user dropped this work because this is an example project. The findings below are historical audit evidence, not a pending implementation task. Prepared backup scripts, tests and guide have been removed.

### Findings

No backup script, scheduler configuration, retention/off-server policy, restore runbook, or incident procedure was found in the three repos. The PostgreSQL persistent volume is present, but no live VPS backup state was inspected. Therefore: repository recovery tooling/documentation is missing; server backups are unverified, not proven absent.

A disposable PostgreSQL 17 container with network disabled and all data on tmpfs successfully:

1. Created a table and synthetic row in a source database.
2. Created a custom-format `pg_dump` archive.
3. Restored it with `pg_restore --exit-on-error` into a separate database.
4. Verified the restored row and removed the test container.

This establishes that the tool workflow works on synthetic data. It does not validate an actual payroll backup, schema completeness, production restore time, or an off-server copy.

### Proposed Fix

First inventory existing VPS backup jobs and files. Add version-controlled backup/restore tooling and an incident runbook; deploy through Git/manual actions rather than leaving ad hoc modified server files. Use consistent custom-format dumps, temporary output plus successful-completion rename, restricted file permissions, retention, protected off-server copies, and safe failure notification through an explicitly authorized channel.

Document recovery of database roles/configuration and other required assets, choose backup frequency/retention and acceptable data-loss/recovery windows with the user, and test a real backup in an isolated database. Restore tests must never overwrite UAT/production in place. See [PostgreSQL dump](https://www.postgresql.org/docs/17/backup-dump.html) and [restore](https://www.postgresql.org/docs/17/app-pgrestore.html) documentation.

## Priority and Next Step

Prioritize logging leaks and outdated runtime images. Add Git secret-prevention rules/CI, and establish the actual backup/recovery state before defining the server rollout. All four tasks remain pending remediation/approval or remote verification. No newly identified fixes have been implemented.

Docker Scout scanning of private built images was rejected by automatic approval review due to possible external SBOM/metadata disclosure. The completed fallback used Trivy offline with networking disabled; private image data was not submitted to Scout.
