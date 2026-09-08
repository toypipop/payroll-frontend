import { describe, expect, it } from "vitest";
import { endOfBangkokMonth } from "./bangkokTime";

describe("endOfBangkokMonth", () => {
    it("returns the last calendar day for ordinary and leap-year months", () => {
        expect(endOfBangkokMonth("2027-04-12")).toBe("2027-04-30");
        expect(endOfBangkokMonth("2028-02-01")).toBe("2028-02-29");
    });

    it("rejects malformed calendar dates", () => {
        expect(endOfBangkokMonth("2027-02-30")).toBe("");
    });
});
