import { logApiFailure } from "../../../utils/apiDiagnostic";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../api/axiosInstance";
import type { AppModule, ApiId } from "../../../types/api";
import type { Role, OptionRow, Company } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import { hasPermissionChanges } from "./permissionState";

// One editable row of the matrix: what the module allows, and what this role currently holds on it.
export interface PermissionRow {
    module_id?: ApiId;
    // A category is a heading in the tree, not a page: it holds no permissions and is never sent on save.
    is_category: boolean;
    module_key: string;
    module_name: string;
    companies_name: string;
    allowed_actions: string[];
    allowed_scopes: string[];
    actions_atomic: boolean;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    data_scope: string;
}

// The same row once it has been placed in a group: it now knows where it sits in the flat list, which is
// the index every edit writes back through.
export type GroupedPermissionRow = PermissionRow & { _flatIdx: number };

// A category and the rows shown under it, in the module tree's own order.
export interface PermissionGroup {
    categoryName: string;
    items: GroupedPermissionRow[];
}

// What the server sends for one role: every module, plus the access rows the role holds.
interface PermissionResponse {
    modules: AppModule[];
    access: {
        module_id?: ApiId;
        can_view?: boolean;
        can_create?: boolean;
        can_edit?: boolean;
        can_delete?: boolean;
        data_scope?: string;
    }[];
}

export const dataScopeOptions = [
    { id: "Own", name: "Own Data Only" },
    { id: "Department", name: "Department Scope" },
    { id: "Companies", name: "Full Companies" },
];

// usePermissionMatrix owns everything the matrix reads and writes: the roles list, the module tree, and the editable rows for the selected role.
export const usePermissionMatrix = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Role | null>(null);
    const [permissions, setPermissions] = useState<PermissionRow[]>([]);
    const [savedPermissions, setSavedPermissions] = useState<PermissionRow[]>([]);
    const [moduleTree, setModuleTree] = useState<AppModule[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // Fetch module tree once — same source as the Sidebar
    useEffect(() => {
        api.get<AppModule[]>("/modules").then(res => {
            const all = res.data;
            const tree = all
                .filter(m => !m.parent_id)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(parent => ({
                    ...parent,
                    children: all
                        .filter(c => c.parent_id === parent.id)
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
                }));
            setModuleTree(tree);
        }).catch(err => logApiFailure("permissions.load", err));
    }, []);

    const selectRole = useCallback(async (role: Role | null) => {
        if (!role) return;
        setSelectedRoles(role);
        setLoading(true);
        setError("");
        setNotice("");
        try {
            const res = await api.get<PermissionResponse>(`/permissions/${role.id}`);
            const matrixData: PermissionRow[] = res.data.modules.map((m) => {
                const access = res.data.access.find((a) => a.module_id === m.id);
                const allowedScopes: string[] = m.allowed_scopes ?? ["Companies"];
                const savedScope = access?.data_scope;
                return {
                    module_id: m.id,
                    is_category: Boolean(m.is_category),
                    module_key: m.module_key,
                    module_name: m.module_name,
                    companies_name: role.companies?.name || "System",
                    // Capability travels with the row so every column can ask the backend's answer instead of guessing from the key.
                    allowed_actions: m.allowed_actions || [],
                    allowed_scopes: allowedScopes,
                    actions_atomic: Boolean(m.actions_atomic),
                    can_view: Boolean(access?.can_view),
                    can_create: Boolean(access?.can_create),
                    can_edit: Boolean(access?.can_edit),
                    can_delete: Boolean(access?.can_delete),
                    // Clamp to something this module can honour — a stored scope from before the module was locked down would otherwise show a value the server will not apply.
                    data_scope: savedScope && allowedScopes.includes(savedScope) ? savedScope : allowedScopes[0],
                };
            });
            setPermissions(matrixData);
            setSavedPermissions(matrixData);
        } catch (err) {
            setPermissions([]);
            setSavedPermissions([]);
            setError(apiErrorMessage(err, "Unable to load permissions."));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            const [res, companies] = await Promise.all([
                api.get<OptionRow[]>("/roles/options"), api.get<Company[]>("/companies/options"),
            ]);
            const rows: Role[] = res.data.map((option) => ({
                id: option.id, roles_name: option.name, companies_id: option.companies_id,
                companies: companies.data.find((company) => String(company.id) === String(option.companies_id)),
            }));
            setRoles(rows);
            if (rows.length > 0) void selectRole(rows[0]);
        } catch (err) {
            setError(apiErrorMessage(err, "Unable to load roles."));
        }
    }, [selectRole]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // A caller either names one field, or hands over a patch of several at once.
    const updateLocal = (index: number | undefined, field: keyof PermissionRow | Partial<PermissionRow>, value?: unknown) => {
        if (index === undefined) return;
        setPermissions((prev) => {
            const newData = [...prev];
            if (typeof field === "object") {
                newData[index] = { ...newData[index], ...field };
            } else {
                newData[index] = { ...newData[index], [field]: value } as PermissionRow;
            }
            return newData;
        });
    };

    const save = async (): Promise<boolean> => {
        if (!selectedRoles || saving || !hasPermissionChanges(savedPermissions, permissions)) return false;
        try {
            setSaving(true);
            setError("");
            setNotice("");
            // The handler binds six fields; the rest of the row is capability the server sent us in the
            // first place. Categories are dropped because they carry no permission row — and every
            // remaining module is sent whether or not it is ticked, since the server replaces the role's
            // rows wholesale and an omitted module would lose its saved data_scope.
            const payload = permissions
                .filter((row) => !row.is_category)
                .map(({ module_id, can_view, can_create, can_edit, can_delete, data_scope }) => ({
                    module_id,
                    can_view,
                    can_create,
                    can_edit,
                    can_delete,
                    data_scope,
                }));
            await api.post(`/permissions/${selectedRoles.id}`, payload);
            // Reload the persisted matrix because the backend clamps unsupported
            // actions and scopes to the module capability contract.
            await selectRole(selectedRoles);
            setNotice("Permissions saved.");
            return true;
        } catch (err) {
            setError(apiErrorMessage(err, "Unable to save permissions."));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const discardChanges = () => {
        setPermissions(savedPermissions);
        setNotice("");
    };

    // Group permissions by sidebar category order
    const groupedPermissions = useMemo(() => {
        if (!moduleTree.length) return [];
        const permMap = new Map<ApiId | undefined, GroupedPermissionRow>(
            permissions.map((p, idx) => [p.module_id, { ...p, _flatIdx: idx }]));
        const groups: PermissionGroup[] = [];

        // Render in the module tree's own order (driven by seed `Order`).
        for (const node of moduleTree) {
            if (node.is_category) {
                const items = (node.children || [])
                    .map(child => permMap.get(child.id))
                    .filter((item): item is GroupedPermissionRow => Boolean(item));
                if (items.length > 0) {
                    groups.push({ categoryName: node.module_name, items });
                }
            } else {
                const item = permMap.get(node.id);
                if (item) groups.push({ categoryName: node.module_name, items: [item] });
            }
        }

        return groups;
    }, [moduleTree, permissions]);

    const isDirty = hasPermissionChanges(savedPermissions, permissions);

    return { roles, selectedRoles, permissions, groupedPermissions, loading, saving, isDirty, error, notice, selectRole, updateLocal, save, discardChanges };
};

export default usePermissionMatrix;
