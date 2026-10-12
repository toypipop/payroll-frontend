import { describe, expect, it } from "vitest";
import { companyPhoneField, companyTaxIDField, emailField, textField } from "./fieldValidation";
import { salaryAmountSchema, validSalaryAmount } from "./salaryValidation";
import { MAX_ADJUSTMENT_AMOUNT } from "./adjustmentAmount";

describe("database text contracts", () => {
    it.each([50, 100, 150, 200, 255, 500])("matches the Unicode boundary of varchar(%s)", (maximum) => {
        const schema = textField("Name", 1, maximum);
        for (const character of ["A", "ก", "😀"]) {
            expect(schema.parse(" " + character.repeat(maximum) + " ")).toBe(character.repeat(maximum));
            expect(schema.safeParse(character.repeat(maximum + 1)).success).toBe(false);
        }
        expect(schema.safeParse(" \t ").success).toBe(false);
        expect(schema.safeParse("bad\0name").success).toBe(false);
    });
    it("preserves optional untrimmed notes and rejects oversized notes", () => {
        expect(textField("Remark", 0, 255, false).parse(" note ")).toBe(" note ");
        expect(textField("Remark", 0, 255, false).parse("")).toBe("");
        expect(textField("Reason", 0, 500, false).safeParse("ก".repeat(501)).success).toBe(false);
    });
    it("uses the same Unicode whitespace contract as the API", () => {
        expect(textField("Name", 1).parse("\ufeff Name \ufeff")).toBe("Name");
        expect(textField("Name", 1).parse("\u0085Name\u0085")).toBe("\u0085Name\u0085");
    });
    it("validates company tax IDs and phones without losing leading zeroes", () => {
        expect(companyTaxIDField.parse(" 0123456789012 ")).toBe("0123456789012");
        expect(companyPhoneField.parse(" 0812345678 ")).toBe("0812345678");
        for (const value of ["", "123", "123456789012a"]) expect(companyTaxIDField.safeParse(value).success).toBe(false);
        for (const value of ["", "123", "08123456789", "081234567a"]) expect(companyPhoneField.safeParse(value).success).toBe(false);
    });
    it("accepts ordinary emails and rejects display names or malformed addresses", () => {
        expect(emailField.parse(" user+pay@example.com ")).toBe("user+pay@example.com");
        for (const value of ["", "User <user@example.com>", "a@", "a b@example.com", "a@localhost"]) expect(emailField.safeParse(value).success).toBe(false);
    });
});

describe("salary numeric contract", () => {
    it("matches decimal(15,2) bounds and preserves the existing zero create rule", () => {
        expect(salaryAmountSchema(0).parse("0")).toBe(0);
        expect(salaryAmountSchema(0.01).safeParse(0).success).toBe(false);
        expect(salaryAmountSchema(0.01).parse(MAX_ADJUSTMENT_AMOUNT)).toBe(MAX_ADJUSTMENT_AMOUNT);
        for (const value of [-1, 1e13, NaN, Infinity, -Infinity, 30.001]) {
            expect(salaryAmountSchema(0).safeParse(value).success).toBe(false);
            expect(validSalaryAmount(value)).toBe(false);
        }
    });
});
