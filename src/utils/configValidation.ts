import * as z from "zod";

// Configuration money/rate columns in the API use decimal(10,2).
export const MAX_CONFIG_AMOUNT = 99_999_999.99;
const configNumber = (label: string, maximum: number) => z.preprocess(
    (value) => typeof value === "string" && value.trim() !== "" ? Number(value) : value,
    z.number().min(0, label + " must be at least 0").max(maximum, label + " must be at most " + maximum.toLocaleString("en-US")),
);
export const ssoRateSchema = configNumber("SSO rate (%)", 100);
export const configAmountSchema = configNumber("Amount", MAX_CONFIG_AMOUNT);
export const configRateSchema = configNumber("Rate", MAX_CONFIG_AMOUNT);
export const optionalConfigRateSchema = z.preprocess(
    (value) => value == null || (typeof value === "string" && value.trim() === "") ? 0 : value,
    configRateSchema,
);
export const taxCalculationSchema = z.string().pipe(z.enum(["Progressive", "None"], { error: "Select Progressive or None" }));
