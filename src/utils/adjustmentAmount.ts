import * as z from "zod";

// Must match service/adjustment_amount.go in payroll-backend (decimal(15,2)).
export const MAX_ADJUSTMENT_AMOUNT = 9_999_999_999_999.99;

export const adjustmentAmountSchema = z.preprocess(
    (value) => Number(value),
    z.number()
        .min(0.01, "Amount must be at least 0.01")
        .max(MAX_ADJUSTMENT_AMOUNT, "Amount must be at most 9,999,999,999,999.99"),
);
