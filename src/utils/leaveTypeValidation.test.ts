import { describe, expect, it } from "vitest";
import { leaveDaysPerYearSchema, leaveTypeNameSchema } from "./leaveTypeValidation";

describe("leave type name validation", () => {
    it("trims names before saving", () => {
        expect(leaveTypeNameSchema.parse(" ลาป่วย ")).toBe("ลาป่วย");
    });
    it.each(["", " \t\n", "ก".repeat(101), "😀".repeat(101)])("rejects empty and oversized names", (name) => {
        expect(leaveTypeNameSchema.safeParse(name).success).toBe(false);
    });
    it.each(["ก", "ก".repeat(100), "😀".repeat(100)])("accepts Unicode names within the database limit", (name) => {
        expect(leaveTypeNameSchema.parse(" " + name + " ")).toBe(name);
    });
});

describe("annual leave limit validation", () => {
    it.each([0, 0.01, 30, 999.99, "0", "999.99"])("accepts %s", (value) => {
        expect(leaveDaysPerYearSchema.parse(value)).toBe(Number(value));
    });
    it.each([-0.01, 1000, 999.991, 0.001, Infinity, -Infinity, NaN, "abc"])("rejects %s", (value) => {
        expect(leaveDaysPerYearSchema.safeParse(value).success).toBe(false);
    });
    it("retains the unlimited default", () => {
        expect(leaveDaysPerYearSchema.parse(undefined)).toBe(0);
        expect(leaveDaysPerYearSchema.parse("")).toBe(0);
    });
});
