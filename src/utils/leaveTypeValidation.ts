import * as z from "zod";
import { hasTwoDecimals, textField } from "./fieldValidation";

// Count Unicode code points, matching Go runes and PostgreSQL varchar(100).
export const leaveTypeNameSchema = textField("Leave type name", 1, 100);

// Match the API and decimal(5,2) database column. Zero means unlimited.
export const MAX_LEAVE_DAYS_PER_YEAR = 999.99;
export const leaveDaysPerYearSchema = z.coerce.number()
    .min(0, "Must be 0 or more")
    .max(MAX_LEAVE_DAYS_PER_YEAR, "Must be 999.99 or less")
    .refine(hasTwoDecimals, "Must have at most 2 decimal places")
    .default(0);
