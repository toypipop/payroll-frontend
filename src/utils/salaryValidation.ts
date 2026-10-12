import * as z from "zod";
import { MAX_ADJUSTMENT_AMOUNT } from "./adjustmentAmount";
import { hasTwoDecimals } from "./fieldValidation";

export const salaryAmountSchema = (minimum: number) => z.preprocess(
    (value) => Number(value),
    z.number().min(minimum, `Salary must be at least ${minimum}`).max(MAX_ADJUSTMENT_AMOUNT, "Salary exceeds the supported maximum")
        .refine(hasTwoDecimals, "Salary must have at most 2 decimal places"),
);
export const validSalaryAmount = (value: number, minimum = 0.01) => Number.isFinite(value) && value >= minimum && value <= MAX_ADJUSTMENT_AMOUNT && hasTwoDecimals(value);
