import * as z from "zod";

// Unicode code points match Go rune counts and PostgreSQL varchar limits.
const bankText = (label: string, maximum: number, required: boolean) => z.string().trim()
    .min(required ? 1 : 0, `${label} is required`)
    .refine((value) => Array.from(value).length <= maximum, `${label} must be ${maximum} characters or less`);

export const bankSchema = z.object({
    bank_code: bankText("Bank code", 10, true),
    bank_name: bankText("Bank name", 200, true),
    swift_code: bankText("SWIFT code", 20, false).optional(),
});
