import { describe, expect, it } from "vitest";
import { bangkokCalendarDays, endOfBangkokMonth } from "./bangkokTime";

describe("endOfBangkokMonth", () => {
    it("returns the last calendar day for ordinary and leap-year months", () => {
        expect(endOfBangkokMonth("2027-04-12")).toBe("2027-04-30");
        expect(endOfBangkokMonth("2028-02-01")).toBe("2028-02-29");
    });

    it("rejects malformed calendar dates", () => {
        expect(endOfBangkokMonth("2027-02-30")).toBe("");
    });
});

describe("Bangkok inclusive calendar spans", () => {
    it("counts real dates, including leap days and New Year", () => {
        expect(bangkokCalendarDays("2028-02-28", "2028-03-01")).toBe(3);
        expect(bangkokCalendarDays("2026-12-31", "2027-01-01")).toBe(2);
        expect(bangkokCalendarDays("2026-10-12", "2026-10-12")).toBe(1);
    });
    it("rejects impossible dates instead of rolling them into another month", () => {
        expect(bangkokCalendarDays("2026-02-30", "2026-03-02")).toBeNull();
        expect(bangkokCalendarDays("", "2026-03-02")).toBeNull();
    });
});
