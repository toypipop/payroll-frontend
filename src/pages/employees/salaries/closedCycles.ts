import type { PayrollCycleOption } from "../../../types/api";

// The backend reads an effective date with timeutil.ParseDayStart — midnight of that day in the business
// timezone — and then asks the database for `start_date <= that <= end_date`. This mirrors that, so the
// warning fires on precisely the dates the save would be refused for.
//
// A cycle now spans 00:00:00 to 23:59:59 of its own days, so any instant inside the typed day gives the
// same answer and the offset below is not load-bearing. It is written as +07:00 because that is what the
// server actually does; the thing that would break this is being a whole day out, not seven hours.
const asServerInstant = (dateValue: string): number => Date.parse(`${dateValue}T00:00:00+07:00`);

export const cycleCoversDate = (cycle: PayrollCycleOption, dateValue: string): boolean => {
    const at = asServerInstant(dateValue);
    const start = Date.parse(String(cycle.start_date));
    const end = Date.parse(String(cycle.end_date));
    if (Number.isNaN(at) || Number.isNaN(start) || Number.isNaN(end)) return false;
    return at >= start && at <= end;
};

// closedCycleFor answers which closed period a proposed effective date would land in, for the company
// that owns the salary — which is what lets the form say so before the save round trip returns 409.
export const closedCycleFor = (
    dateValue: string | null | undefined,
    companiesId: number | string | null | undefined,
    cycles: PayrollCycleOption[],
): PayrollCycleOption | null => {
    if (!dateValue || !companiesId) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;

    return cycles.find((cycle) =>
        cycle.is_closed
        && String(cycle.companies_id) === String(companiesId)
        && cycleCoversDate(cycle, dateValue),
    ) ?? null;
};
