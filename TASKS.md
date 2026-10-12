# Pending Security Tasks

Primary repo: `payroll-frontend`. Related repos: `../payroll-backend`, `../infra`.

These are remaining audit work, not confirmed vulnerabilities or an exhaustive inventory of future findings. Investigate and report the issue and proposed solution before implementing newly identified fixes. No push, deployment, or infrastructure reset is authorized.

## Discussion Topics

No separate discussion topics are currently pending. Continue with SEC-01 unless the user selects another task.

## Agreed Tasks

### SEC-01: Secrets and Environment/Git Exposure

- Category/status: Security / Awaiting investigation.
- Repos/modules: all three repos; tracked files, Git history, environment templates, CI, and Docker build contexts.
- Scope: check for credentials/secrets and accidental inclusion in Git, logs, or image build inputs. Real VPS environment contents have not been audited; local checks cannot establish their state.
- Checklist: [ ] tracked files/history; [ ] template/ignore/build rules; [ ] CI handling; [ ] report findings and unresolved remote checks.
- Acceptance/verification: document inspected scope and evidence without printing secrets; report any concrete exposure and proposed remediation before changes.
- Next step: read-only audit. Do not claim a confirmed leak from a suspicious filename alone.

### SEC-02: Docker Image Vulnerabilities

- Category/status: Security / Awaiting investigation.
- Repos/modules: frontend and backend Docker stages, PostgreSQL image, infra Nginx image.
- Scope: inspect the actual image versions/digests and installed OS/runtime packages against current advisories. Dependency upgrade work already completed does not establish that container images are free of vulnerabilities.
- Checklist: [ ] image inventory; [ ] vulnerability scan/advisory assessment; [ ] distinguish build/runtime findings; [ ] propose compatible fixes if needed.
- Acceptance/verification: identify scanned images/digests, actionable findings and limitations; test affected containers for any approved upgrade.
- Next step: scan before deciding whether more version upgrades are needed. No additional dependency upgrade batch is currently confirmed.

### SEC-03: Logging and Audit Coverage

- Category/status: Logging / Security / Awaiting investigation.
- Repos/modules: frontend error handling, backend request/error/domain audit logs, infra Nginx logs.
- Scope: verify request/status/error meanings, useful safe context, important mutation audit coverage, and avoidance of secrets or unnecessary personal data. Audit-log code already exists; this is a coverage/handling review, not an assumption that logs are missing.
- Checklist: [ ] HTTP/error logging; [ ] sensitive-data exposure; [ ] mutation audit coverage; [ ] report gaps and proposals.
- Acceptance/verification: assess actual paths and representative success/failure events; preserve transaction integrity and add relevant tests for approved code fixes.
- Next step: inspect implementation and audit design before proposing changes.

### SEC-04: PostgreSQL Backup, Restore, and Recovery

- Category/status: Recovery / Security / Awaiting investigation.
- Repos/modules: backend PostgreSQL, infra/server backup operations and incident procedures.
- Scope: verify backup scheduling, storage/access, retention, recovery instructions, and evidence that restore works. A persistent Docker volume alone is not a backup. Repository checks cannot establish the live VPS backup state.
- Checklist: [ ] existing scripts/docs; [ ] identify remote facts needed; [ ] assess backup/retention controls; [ ] restore test on an isolated database when authorized; [ ] incident/recovery instructions.
- Acceptance/verification: report verified configuration and limitations; define usable restore steps and recovery expectations based on the user's requirements. Never test restore against UAT/production data in place.
- Next step: inspect existing materials, then request only missing remote information or authorization for externally impactful actions.
