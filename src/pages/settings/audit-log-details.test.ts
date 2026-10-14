import { describe, expect, it } from "vitest";
import { auditSnapshotTarget } from "./audit-log-details";
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
