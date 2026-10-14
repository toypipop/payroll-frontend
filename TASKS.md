# Pending Security Tasks

Primary repo: `payroll-frontend`. Related repos: `../payroll-backend`, `../infra`.

## Discussion Topics

None. Backup work was dropped by the user on 2026-10-14 because this is an example project; its scripts, tests and guide were removed. Repository changes are ready for commit; no deployment has been performed.

## Agreed Tasks

### SEC-02: Follow Up Unpatched Image Advisories

- Category/status: Security / Waiting for upstream fixes; repository remediation and verification complete.
- Repos/modules: PostgreSQL 17 runtime image and frontend npm build tools.
- Problem: patched PostgreSQL still has vendor-unfixed OS advisories, including CVE-2026-6653 in libxml2. npm's bundled http-cache-semantics 4.2.0 has CVE-2026-93748 without a fixed version in the current advisory database. PostgreSQL's gosu helper carries old Go metadata; binary analysis found no vulnerable symbol calls, which is narrower than proof of no risk.
- Proposed resolution: monitor vendor updates, rebuild supported pinned releases when fixes appear, reassess reachability, and rerun offline scans and container smoke tests. Do not upgrade PostgreSQL's major version or hide findings merely to obtain a clean report.
- Acceptance: resolve or explicitly assess remaining high/critical findings with evidence. CI rejects fixable high/critical OS findings; the frontend build gate also checks libraries. Full reports retain unfixed findings.
- Evidence: [implementation report](docs/security-hardening-2026-10-14.md).
