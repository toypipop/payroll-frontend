import type { Tone } from "../../components/common/tone";
import type { PayrollTransactionDetail } from "../../types/api";

// Statutory withholding is deliberately separate from normal deductions in payroll breakdowns.
export const payrollDetailTone = (detail: PayrollTransactionDetail): Tone => {
    if (detail.item_name === "Social Security (SSO)" || detail.item_name === "Income Tax") return "accent";
    if (detail.type === "deduction") return "danger";
    if (detail.is_tax_relevant) return "success";
    return "muted";
};
