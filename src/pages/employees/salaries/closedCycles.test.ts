import { describe, expect, it } from "vitest";
import { closedCycleFor } from "./closedCycles";
import type { PayrollCycleOption } from "../../../types/api";

// Every calendar date in the system is stored in the business timezone: a period opens at midnight of its
// first day and closes on the last instant of its last one. The dates and verdicts below were taken from
// PATCH /salaries/:id against a real Postgres, so this file pins the agreement with the server rather than
// a guess about it.
//
// What it pins is the day arithmetic — the edges, the neighbours, the company scoping. It does not pin the
// time of day the typed date is read at, because a period covering a whole day gives the same answer for
// any instant inside it. An off-by-one-day mistake fails here; an off-by-seven-hours one no longer can.
const cycle = (over: Partial<PayrollCycleOption> = {}): PayrollCycleOption => ({
    id: 29,
    cycle_name: "May 2027",
    start_date: "2027-05-01T00:00:00+07:00",
    end_date: "2027-05-31T23:59:59+07:00",
    is_closed: true,
    companies_id: 3,
    ...over,
});

const openJune = cycle({
    id: 30,
    cycle_name: "June 2027",
    start_date: "2027-06-01T00:00:00+07:00",
    end_date: "2027-06-30T23:59:59+07:00",
    is_closed: false,
});

const nameFor = (date: string, cycles: PayrollCycleOption[], company: number | string = 3) =>
    closedCycleFor(date, company, cycles)?.cycle_name ?? null;

describe("closedCycleFor", () => {
    describe("a closed period", () => {
        const cycles = [cycle(), openJune];

        it("catches every day the server refuses, including both edges", () => {
            expect(nameFor("2027-05-01", cycles)).toBe("May 2027");
            expect(nameFor("2027-05-20", cycles)).toBe("May 2027");
            expect(nameFor("2027-05-31", cycles)).toBe("May 2027");
        });

        it("lets the first day of the next, open period through", () => {
            // The boundary that matters. The closing instant is 23:59:59 on 31 May, so 1 June belongs to
            // June — which is open — and the server accepts it.
            expect(nameFor("2027-06-01", cycles)).toBeNull();
            expect(nameFor("2027-06-30", cycles)).toBeNull();
        });

        it("lets the day before the period through", () => {
            expect(nameFor("2027-04-30", cycles)).toBeNull();
        });
    });

    describe("a period that runs across a year boundary in the business timezone", () => {
        // A January cycle opens at 00:00 Bangkok on 1 Jan, which is 17:00 UTC on 31 December. Reading
        // either side in UTC would put New Year's Day outside its own cycle.
        const january = cycle({
            cycle_name: "January 2027",
            start_date: "2027-01-01T00:00:00+07:00",
            end_date: "2027-01-31T23:59:59+07:00",
        });

        it("covers its first and last day", () => {
            expect(nameFor("2027-01-01", [january])).toBe("January 2027");
            expect(nameFor("2027-01-31", [january])).toBe("January 2027");
        });

        it("does not spill into the days on either side", () => {
            expect(nameFor("2026-12-31", [january])).toBeNull();
            expect(nameFor("2027-02-01", [january])).toBeNull();
        });
    });

    describe("scoping", () => {
        it("ignores a closed period belonging to another company", () => {
            expect(nameFor("2027-05-20", [cycle({ companies_id: 2 })], 3)).toBeNull();
        });

        it("matches the company across a number/string mismatch", () => {
            expect(nameFor("2027-05-20", [cycle()], "3")).toBe("May 2027");
        });

        it("ignores an open period", () => {
            expect(nameFor("2027-05-20", [cycle({ is_closed: false })])).toBeNull();
        });
    });

    describe("nothing to say", () => {
        const cycles = [cycle()];

        it("stays quiet while the field is empty or half typed", () => {
            expect(closedCycleFor("", 3, cycles)).toBeNull();
            expect(closedCycleFor("2027-05", 3, cycles)).toBeNull();
            expect(closedCycleFor("not a date", 3, cycles)).toBeNull();
        });

        it("stays quiet before a company is known", () => {
            expect(closedCycleFor("2027-05-20", null, cycles)).toBeNull();
            expect(closedCycleFor("2027-05-20", undefined, cycles)).toBeNull();
        });

        it("stays quiet when the calendar failed to load", () => {
            expect(closedCycleFor("2027-05-20", 3, [])).toBeNull();
        });
    });
});
