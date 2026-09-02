import { describe, expect, it } from "vitest";
import { newSalaryFor, raiseSummary, roundMoney } from "./bulkRaise";
import type { BulkRaiseRow } from "./bulkRaise";

const row = (over: Partial<BulkRaiseRow> = {}): BulkRaiseRow => ({
    employees_id: 1,
    employee_name: "Ann Lee",
    employees_code: "E-01",
    companies_id: 1,
    current_salary: 40000,
    new_salary: 42000,
    blocked: false,
    blocker: "",
    ...over,
});

// The table shows a figure while the operator is still typing, and the server works out the same one when
// the batch is applied. These pin that the two agree — a preview that disagrees with what gets written is
// worse than no preview at all.
describe("newSalaryFor", () => {
    it("adds a percentage of the current salary", () => {
        expect(newSalaryFor("percent", 5, 40000, 0)).toBe(42000);
    });

    // 45,250.50 plus 5% is 47,513.025, which the column cannot hold.
    it("rounds a percentage to the two decimals the column stores", () => {
        expect(newSalaryFor("percent", 5, 45250.5, 0)).toBe(47513.03);
    });

    it("adds the same amount to everyone", () => {
        expect(newSalaryFor("amount", 2000, 40000, 0)).toBe(42000);
    });

    it("takes the typed figure and ignores the current one", () => {
        expect(newSalaryFor("manual", 999, 40000, 28000)).toBe(28000);
    });
});

describe("roundMoney", () => {
    it("keeps two decimals", () => {
        expect(roundMoney(47513.025)).toBe(47513.03);
        expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    });
});

describe("raiseSummary", () => {
    it("counts what changes and what it costs per period", () => {
        const summary = raiseSummary([
            row({ current_salary: 40000, new_salary: 42000 }),
            row({ employees_id: 2, current_salary: 50000, new_salary: 52500 }),
        ]);
        expect(summary.count).toBe(2);
        expect(summary.total).toBe(4500);
    });

    // A blocked row is not going to be written, so counting it would tell the operator they are about to
    // spend money they are not.
    it("leaves blocked rows out of both figures", () => {
        const summary = raiseSummary([
            row({ current_salary: 40000, new_salary: 42000 }),
            row({ employees_id: 2, blocked: true, blocker: "closed cycle", current_salary: 50000, new_salary: 0 }),
        ]);
        expect(summary.count).toBe(1);
        expect(summary.total).toBe(2000);
    });

    it("says nothing changes when every row is blocked", () => {
        const summary = raiseSummary([row({ blocked: true, blocker: "closed cycle" })]);
        expect(summary.count).toBe(0);
        expect(summary.total).toBe(0);
    });
});
