import type { AuditSnapshot } from "./audit-log-details";

const fields = [
    ["can_view", "View"], ["can_create", "Create"],
    ["can_edit", "Edit"], ["can_delete", "Delete"], ["data_scope", "Scope"],
] as const;
type FieldKey = typeof fields[number][0];
interface Grant {
    module_id: number;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    data_scope: string;
}
interface PermissionSnapshot {
    state: "recorded" | "missing" | "invalid";
    count: number | null;
    grants: Map<number, Grant>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isGrant = (value: unknown): value is Grant => isRecord(value)
    && typeof value.module_id === "number" && Number.isSafeInteger(value.module_id) && value.module_id > 0
    && typeof value.can_view === "boolean" && typeof value.can_create === "boolean"
    && typeof value.can_edit === "boolean" && typeof value.can_delete === "boolean"
    && typeof value.data_scope === "string" && value.data_scope.trim().length > 0;

const readSnapshot = (snapshot: AuditSnapshot): PermissionSnapshot => {
    const count = snapshot?.permission_count;
    const result: PermissionSnapshot = {
        state: "missing", grants: new Map(),
        count: typeof count === "number" && Number.isSafeInteger(count) && count >= 0 ? count : null,
    };
    if (!snapshot || !("permissions" in snapshot)) return result;
    const rows: unknown = snapshot.permissions;
    if (!Array.isArray(rows) || !rows.every(isGrant)
        || new Set(rows.map(row => row.module_id)).size !== rows.length) {
        return { ...result, state: "invalid" };
    }
    return { state: "recorded", count: result.count ?? rows.length,
        grants: new Map(rows.map(row => [row.module_id, row])) };
};

const displayValue = (snapshot: PermissionSnapshot, grant: Grant | undefined, key: FieldKey): string => {
    if (snapshot.state === "missing") return "Not recorded";
    if (snapshot.state === "invalid") return "Invalid snapshot";
    if (!grant) return "Not configured";
    const value = grant[key];
    return typeof value === "boolean" ? (value ? "Yes" : "No") : value;
};

// Compare immutable audit snapshots by module ID, never by array order or live permissions.
export const permissionAuditChanges = (beforeData: AuditSnapshot, afterData: AuditSnapshot) => {
    const before = readSnapshot(beforeData);
    const after = readSnapshot(afterData);
    const ids = [...new Set([...before.grants.keys(), ...after.grants.keys()])].sort((a, b) => a - b);
    const modules = ids.map(id => {
        const from = before.grants.get(id);
        const to = after.grants.get(id);
        const changes = fields.filter(([key]) => before.state !== "recorded" || after.state !== "recorded"
            || !from || !to || from[key] !== to[key]).map(([key, label]) => ({
            key, label, before: displayValue(before, from, key), after: displayValue(after, to, key),
        }));
        return { id, changes };
    }).filter(module => module.changes.length > 0);
    return { before, after, modules };
};
