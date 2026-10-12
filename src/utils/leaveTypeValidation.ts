import * as z from "zod";

// Count Unicode code points, matching Go runes and PostgreSQL varchar(100).
export const leaveTypeNameSchema = z.string().trim()
    .min(1, "Leave type name is required")
    .refine((value) => Array.from(value).length <= 100, "Must be 100 characters or less");

// Match the API and decimal(5,2) database column. Zero means unlimited.
export const MAX_LEAVE_DAYS_PER_YEAR = 999.99;
export const leaveDaysPerYearSchema = z.coerce.number()
    .min(0, "Must be 0 or more")
    .max(MAX_LEAVE_DAYS_PER_YEAR, "Must be 999.99 or less")
    .default(0);
