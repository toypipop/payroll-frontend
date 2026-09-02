import { describe, expect, it } from "vitest";
import { lockedReason, salaryActiveDefault } from "./salaryShape";

// A locked row is normally locked by several cycles at once — in the seeded data every locked record has
// been through five — so the line has to name one and account for the rest rather than list them all.
describe("lockedReason", () => {
    it("names the cycle when only one paid from the record", () => {
        expect(lockedReason(["March 2027"]).label).toBe("Paid in March 2027");
    });

    it("names the most recent cycle and counts the rest", () => {
        const { label } = lockedReason(["January 2027", "February 2027", "March 2027"]);
        expect(label).toBe("Paid in March 2027 +2 more");
    });

    it("puts every cycle in the tooltip, in the order they ran", () => {
        const { title } = lockedReason(["January 2027", "February 2027", "March 2027"]);
        expect(title).toBe("Paid in 3 closed payroll cycles: January 2027, February 2027, March 2027");
    });

    it("keeps the tooltip singular for one cycle", () => {
        expect(lockedReason(["March 2027"]).title).toBe("Paid in 1 closed payroll cycle: March 2027");
    });

    // A row that reaches this helper with nothing in it is a row an older server answered, before the API
    // carried the names. The screen still has to say something, and it must not say "Paid in undefined".
    it("falls back to the old wording when the server sent no names", () => {
        expect(lockedReason([]).label).toBe("");
        expect(lockedReason([]).title).toBe("Already used in a payroll calculation");
        expect(lockedReason(undefined).label).toBe("");
        expect(lockedReason(undefined).title).toBe("Already used in a payroll calculation");
    });
});

// GET /salaries answers "nothing in force" with a placeholder structure rather than nothing at all, and the
// placeholder carries is_active: false. Trusting that flag opened the form unticked, so a first salary was
// posted as a disable: the server switched off nothing, answered 200, and the amount was never written.
describe("salaryActiveDefault", () => {
    const placeholder = { id: 0, base_salaries: 0, is_active: false, effective_date: "0001-01-01T00:00:00Z" };

    it("starts switched on when the row has no salary record yet", () => {
        expect(salaryActiveDefault(placeholder)).toBe(true);
        expect(salaryActiveDefault(null)).toBe(true);
    });

    it("keeps a real record's own flag", () => {
        expect(salaryActiveDefault({ id: 11, is_active: true })).toBe(true);
        expect(salaryActiveDefault({ id: 11, is_active: false })).toBe(false);
    });

    it("falls back to the soft-delete marker when a real record carries no flag", () => {
        expect(salaryActiveDefault({ id: 11, deleted_at: 0 })).toBe(true);
        expect(salaryActiveDefault({ id: 11, deleted_at: "2027-01-01T00:00:00Z" })).toBe(false);
    });
});
