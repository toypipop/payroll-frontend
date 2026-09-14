export interface AuditField {
    label: string;
    value: string;
}

export type AuditSnapshot = Record<string, unknown> | null | undefined;

const FIELD_LABELS: Record<string, string> = {
    base_salary: "Base Salary",
    effective_date: "Effective Date",
    is_active: "Active",
    is_paid: "Paid",
    max_days_per_year: "Max Days Per Year",
    employees_id: "Employee ID",
};

const labelFor = (key: string): string => FIELD_LABELS[key]
    ?? key.split("_").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "").join(" ");

const valueFor = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
    if (typeof value === "string") return value;
    return "—";
};

// formatAuditSnapshot is deliberately snapshot-only: audit details must never be rewritten from a record's current value.
export const formatAuditSnapshot = (snapshot: AuditSnapshot): AuditField[] => Object.entries(snapshot ?? {})
    .map(([key, value]) => ({ label: labelFor(key), value: valueFor(value) }));

const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

// auditSnapshotTarget finds a stable, human-readable target only when it was written into this event.
export const auditSnapshotTarget = (snapshot: AuditSnapshot): string => {
    const data = snapshot ?? {};
    const employeeName = [text(data.first_name), text(data.last_name)].filter(Boolean).join(" ");
    const employeeCode = text(data.employees_code);
    if (employeeName) return employeeCode ? `${employeeCode} — ${employeeName}` : employeeName;

    for (const key of ["name", "cycle_name", "roles_name", "bank_name", "leave_type"]) {
        const value = text(data[key]);
        if (value) return value;
    }
    return "Name unavailable in this audit snapshot";
};
