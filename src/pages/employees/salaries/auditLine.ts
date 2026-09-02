import type { SalaryAuditEntry } from "../../../types/domain";

// What each action is called on screen. The server's values are snake_case identifiers, not labels, and a
// reader should not have to know that "switched_off" means the employee's pay was turned off entirely.
const ACTION_LABEL: Record<SalaryAuditEntry["action"], string> = {
    created: "Added",
    amount_changed: "Amount changed",
    moved: "Moved",
    switched_off: "Switched off",
    deleted: "Deleted",
};

const amount = (value: number | null): string | null =>
    value === null || value === undefined
        ? null
        : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// A stored calendar date rendered in the business timezone, like every other date in the app.
const day = (value: string | null): string | null => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-GB", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const auditActionLabel = (action: SalaryAuditEntry["action"]): string =>
    ACTION_LABEL[action] ?? action;

// auditChangeText says what actually moved, in one line, or nothing when the action carries no before and
// after — switching a salary off changes no figure, only whether any of them apply.
export const auditChangeText = (entry: SalaryAuditEntry): string => {
    const parts: string[] = [];

    const fromMoney = amount(entry.from_amount);
    const toMoney = amount(entry.to_amount);
    if (fromMoney !== null && toMoney !== null && fromMoney !== toMoney) {
        parts.push(`${fromMoney} → ${toMoney}`);
    } else if (toMoney !== null && fromMoney === null) {
        parts.push(toMoney);
    } else if (fromMoney !== null && toMoney === null) {
        parts.push(fromMoney);
    }

    const fromDay = day(entry.from_date);
    const toDay = day(entry.to_date);
    if (fromDay && toDay && fromDay !== toDay) {
        parts.push(`${fromDay} → ${toDay}`);
    } else if (toDay && !fromDay) {
        parts.push(`effective ${toDay}`);
    } else if (fromDay && !toDay) {
        parts.push(`effective ${fromDay}`);
    }

    return parts.join(" · ");
};
