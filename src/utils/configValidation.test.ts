import { describe, expect, it } from "vitest";
import { configAmountSchema, configRateSchema, MAX_CONFIG_AMOUNT, optionalConfigRateSchema, ssoRateSchema, taxCalculationSchema } from "./configValidation";

describe("configuration validation contract", () => {
    it.each([0, 5, 100, "0", "100"])("accepts SSO percentage %s", (value) => {
        expect(ssoRateSchema.parse(value)).toBe(Number(value));
    });
    it.each([-1, 100.01, Infinity, NaN, "5abc", "", null])("rejects SSO percentage %s", (value) => {
        expect(ssoRateSchema.safeParse(value).success).toBe(false);
    });
    it.each([configAmountSchema, configRateSchema])("accepts zero and decimal boundaries", (schema) => {
        expect(schema.parse(0)).toBe(0);
        expect(schema.parse(String(MAX_CONFIG_AMOUNT))).toBe(MAX_CONFIG_AMOUNT);
        for (const value of [-1, 100_000_000, Infinity, -Infinity, NaN, "12abc", "", null]) {
            expect(schema.safeParse(value).success).toBe(false);
        }
    });
    it.each([null, undefined, "", " ", 0, "0"])("maps an optional empty/zero rate %s to zero", (value) => {
        expect(optionalConfigRateSchema.parse(value)).toBe(0);
    });
    it.each([-1, "-1", 100_000_000, "abc", Infinity])("rejects invalid optional rate %s", (value) => {
        expect(optionalConfigRateSchema.safeParse(value).success).toBe(false);
    });
    it("accepts only supported tax methods", () => {
        expect(taxCalculationSchema.parse("Progressive")).toBe("Progressive");
        expect(taxCalculationSchema.parse("None")).toBe("None");
        expect(taxCalculationSchema.safeParse("Unknown").success).toBe(false);
    });
});
