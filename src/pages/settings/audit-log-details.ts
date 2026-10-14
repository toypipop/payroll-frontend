export type AuditSnapshot = Record<string, unknown> | null | undefined;

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
