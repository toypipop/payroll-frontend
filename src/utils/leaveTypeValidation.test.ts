import { describe, expect, it } from "vitest";
import { leaveDaysPerYearSchema } from "./leaveTypeValidation";

describe("annual leave limit validation", () => {
    it.each([0, 0.01, 30, 999.99, "0", "999.99"])("accepts %s", (value) => {
        expect(leaveDaysPerYearSchema.parse(value)).toBe(Number(value));
    });
    it.each([-0.01, 1000, 999.991, Infinity, -Infinity, NaN, "abc"])("rejects %s", (value) => {
        expect(leaveDaysPerYearSchema.safeParse(value).success).toBe(false);
    });
    it("retains the unlimited default", () => {
        expect(leaveDaysPerYearSchema.parse(undefined)).toBe(0);
        expect(leaveDaysPerYearSchema.parse("")).toBe(0);
    });
});
