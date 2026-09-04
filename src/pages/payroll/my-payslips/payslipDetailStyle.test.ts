import { describe, expect, it } from "vitest";
import { payslipDetailAmountClass } from "./payslipDetailStyle";

describe("payslipDetailAmountClass", () => {
    it("keeps statutory SSO yellow in a payslip breakdown", () => {
        expect(payslipDetailAmountClass({ item_name: "Social Security (SSO)", type: "deduction" }))
            .toContain("text-accent");
    });

    it("renders a non-statutory deduction red", () => {
        expect(payslipDetailAmountClass({ item_name: "Loan repayment", type: "deduction", is_tax_relevant: true }))
            .toContain("text-danger-text");
    });
});
