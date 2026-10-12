import * as z from "zod";

// Count Unicode code points, matching PostgreSQL varchar and Go runes.
export const textField = (label: string, minimum: number, maximum?: number, trim = true) => {
    const text = trim ? z.string().trim() : z.string();
    return text
        .refine((value) => !value.includes("\0"), `${label} contains unsupported characters`)
        .refine((value) => Array.from(value).length >= minimum, `${label} must have at least ${minimum} characters`)
        .refine((value) => maximum === undefined || Array.from(value).length <= maximum, `${label} must have at most ${maximum} characters`);
};

export const emailField = textField("Email", 1, 150).refine(
    (value) => /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value),
    "Invalid email address",
);
export const companyTaxIDField = textField("Tax ID", 13, 13).refine((value) => /^\d{13}$/.test(value), "Tax ID must be exactly 13 digits");
export const companyPhoneField = textField("Phone", 9, 10).refine((value) => /^\d{9,10}$/.test(value), "Phone must contain 9–10 digits");

export const hasTwoDecimals = (value: number) => Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
