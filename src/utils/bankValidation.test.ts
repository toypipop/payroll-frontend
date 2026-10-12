import { describe, expect, it } from "vitest";
import { bankSchema } from "./bankValidation";

describe("bank validation", () => {
    const valid = { bank_code: "BBL", bank_name: "ธนาคาร", swift_code: "" };
    it("trims all fields and permits empty or omitted SWIFT", () => {
        expect(bankSchema.parse({ bank_code: " BBL ", bank_name: " ธนาคาร ", swift_code: " \t " })).toEqual(valid);
        expect(bankSchema.safeParse({ bank_code: "BBL", bank_name: "ธนาคาร" }).success).toBe(true);
    });
    it.each(["bank_code", "bank_name"] as const)("rejects whitespace-only %s", (field) => {
        expect(bankSchema.safeParse({ ...valid, [field]: " \t " }).success).toBe(false);
    });
    it.each([["bank_code", 10], ["bank_name", 200], ["swift_code", 20]] as const)("bounds %s by Unicode code points", (field, maximum) => {
        for (const character of ["A", "ก", "😀"]) {
            expect(bankSchema.safeParse({ ...valid, [field]: " " + character.repeat(maximum) + " " }).success).toBe(true);
            expect(bankSchema.safeParse({ ...valid, [field]: character.repeat(maximum + 1) }).success).toBe(false);
        }
    });
});
