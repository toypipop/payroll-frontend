import { describe, expect, it } from "vitest";
import { adjustmentAmountSchema, MAX_ADJUSTMENT_AMOUNT } from "./adjustmentAmount";

describe("adjustment amount contract", () => {
    it.each([0.01, 100, 123.45, MAX_ADJUSTMENT_AMOUNT, "0.01", "123.45"])("accepts valid amount %s", (value) => {
        expect(adjustmentAmountSchema.parse(value)).toBe(Number(value));
    });
    it.each([-500, 0, 0.0099, 10_000_000_000_000, "10000000000000", NaN, Infinity, -Infinity, "", null, undefined, "NaN"])("rejects invalid amount %s", (value) => {
        expect(adjustmentAmountSchema.safeParse(value).success).toBe(false);
    });
});
