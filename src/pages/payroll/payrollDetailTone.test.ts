import { describe, expect, it } from "vitest";
import { payrollDetailTone } from "./payrollDetailTone";

describe("payrollDetailTone", () => {
    it("uses the yellow accent tone for the statutory SSO line in taxable-income details", () => {
        expect(payrollDetailTone({
            item_name: "Social Security (SSO)",
            amount: 750,
            type: "deduction",
            is_tax_relevant: true,
        })).toBe("accent");
    });

    it("keeps an ordinary tax-deductible deduction distinct from SSO", () => {
        expect(payrollDetailTone({
            item_name: "Provident Fund",
            amount: 500,
            type: "deduction",
            is_tax_relevant: true,
        })).toBe("danger");
    });

    it("renders an ordinary deduction red even when it is not tax-relevant", () => {
        expect(payrollDetailTone({
            item_name: "Provident Fund",
            amount: 500,
            type: "deduction",
            is_tax_relevant: false,
        })).toBe("danger");
    });
});
