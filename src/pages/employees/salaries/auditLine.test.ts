import { describe, expect, it } from "vitest";
import { auditActionLabel, auditChangeText } from "./auditLine";
import type { SalaryAuditEntry } from "../../../types/domain";

const entry = (over: Partial<SalaryAuditEntry> = {}): SalaryAuditEntry => ({
    id: 1,
    created_at: "2027-07-15T00:00:00+07:00",
    action: "moved",
    reason: "corrected",
    actor_id: 1,
    actor_name: "System Admin",
    salaries_structure_id: 9,
    from_amount: null,
    to_amount: null,
    from_date: null,
    to_date: null,
    ...over,
});

describe("auditActionLabel", () => {
    it("reads as a sentence rather than as the server's identifier", () => {
        expect(auditActionLabel("switched_off")).toBe("Switched off");
        expect(auditActionLabel("amount_changed")).toBe("Amount changed");
        expect(auditActionLabel("created")).toBe("Added");
    });
});

describe("auditChangeText", () => {
    it("shows both sides of an amount that moved", () => {
        expect(auditChangeText(entry({ from_amount: 50000, to_amount: 80000 })))
            .toBe("50,000.00 → 80,000.00");
    });

    it("shows one amount when there is nothing to compare it to", () => {
        expect(auditChangeText(entry({ action: "created", to_amount: 30000 }))).toBe("30,000.00");
        expect(auditChangeText(entry({ action: "deleted", from_amount: 30000 }))).toBe("30,000.00");
    });

    it("shows both dates of a move", () => {
        const text = auditChangeText(entry({ from_date: "2027-07-01T00:00:00+07:00", to_date: "2027-07-15T00:00:00+07:00" }));
        expect(text).toBe("01 Jul 2027 → 15 Jul 2027");
    });

    // Dates are read in the business timezone like everywhere else: an effective date stored at midnight
    // Bangkok is 17:00 the previous day in UTC, and reading it raw would name the wrong day.
    it("reads a date in the business timezone", () => {
        expect(auditChangeText(entry({ action: "created", to_date: "2027-01-01T00:00:00+07:00" })))
            .toBe("effective 01 Jan 2027");
    });

    it("combines the amount and the dates", () => {
        const text = auditChangeText(entry({
            from_amount: 50000, to_amount: 80000,
            from_date: "2027-07-01T00:00:00+07:00", to_date: "2027-07-15T00:00:00+07:00",
        }));
        expect(text).toBe("50,000.00 → 80,000.00 · 01 Jul 2027 → 15 Jul 2027");
    });

    it("says nothing when an amount was re-saved unchanged", () => {
        expect(auditChangeText(entry({ from_amount: 50000, to_amount: 50000 }))).toBe("");
    });

    // Switching a salary off changes no figure, only whether any of them apply, so the line carries only the
    // action and the reason.
    it("says nothing for a switch-off", () => {
        expect(auditChangeText(entry({ action: "switched_off" }))).toBe("");
    });

    it("ignores a date the server could not give", () => {
        expect(auditChangeText(entry({ action: "created", to_amount: 100, to_date: "not a date" })))
            .toBe("100.00");
    });
});
