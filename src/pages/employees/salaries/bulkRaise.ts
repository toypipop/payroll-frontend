// How a new figure is worked out from the current one. The strings match what the API accepts.
export type BulkRaiseMode = "percent" | "amount" | "manual";

// GET /salaries/bulk/preview — what the batch would do to one employee.
export interface BulkRaiseRow {
    employees_id: number;
    employee_name: string;
    employees_code: string;
    companies_id: number;
    current_salary: number;
    new_salary: number;
    // Blocked says this person cannot be raised on this date, and blocker says why. Any blocked row refuses
    // the whole batch, so these are what the screen leads on.
    blocked: boolean;
    blocker: string;
}

export interface BulkRaisePreview {
    rows: BulkRaiseRow[];
    blocked_count: number;
}

// roundMoney matches the server: two decimals, which is what the column stores. The preview shows the
// rounded figure so the number on screen is the number that gets written.
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

// newSalaryFor is the same arithmetic the server does, so the table can show a figure while the operator is
// still typing rather than only after a round trip. The server's answer is what is stored either way.
export const newSalaryFor = (
    mode: BulkRaiseMode,
    value: number,
    current: number,
    typed: number,
): number => {
    switch (mode) {
        case "percent":
            return roundMoney(current * (1 + value / 100));
        case "amount":
            return roundMoney(current + value);
        default:
            return roundMoney(typed);
    }
};

// raiseSummary is the sentence above the table: how many people, and what it costs per period.
export const raiseSummary = (rows: BulkRaiseRow[]): { count: number; total: number } => {
    const usable = rows.filter((row) => !row.blocked);
    return {
        count: usable.length,
        total: roundMoney(usable.reduce((sum, row) => sum + (row.new_salary - row.current_salary), 0)),
    };
};

export const money = (value: number): string =>
    Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
