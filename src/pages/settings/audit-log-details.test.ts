import { describe, expect, it } from "vitest";

import { auditSnapshotTarget, formatAuditSnapshot } from "./audit-log-details";

describe("formatAuditSnapshot", () => {
    it("turns stored audit JSON into readable English fields", () => {
        expect(formatAuditSnapshot({
            base_salary: 30000,
            effective_date: "2026-09-01",
            is_active: true,
            employees_id: 42,
        })).toEqual([
            { label: "Base Salary", value: "30,000" },
            { label: "Effective Date", value: "2026-09-01" },
            { label: "Active", value: "Yes" },
            { label: "Employee ID", value: "42" },
        ]);
    });

    it("retains false and zero values instead of treating them as missing", () => {
        expect(formatAuditSnapshot({ is_paid: false, max_days_per_year: 0 })).toEqual([
            { label: "Paid", value: "No" },
            { label: "Max Days Per Year", value: "0" },
        ]);
    });
});

describe("auditSnapshotTarget", () => {
    it("uses a name stored in the event snapshot", () => {
        expect(auditSnapshotTarget({ employees_code: "EMP-001", first_name: "Test", last_name: "User" }))
            .toBe("EMP-001 — Test User");
    });

    it("does not look up current data when the snapshot has no readable target", () => {
        expect(auditSnapshotTarget({ base_salary: 30000, employees_id: 42 }))
            .toBe("Name unavailable in this audit snapshot");
    });
});
