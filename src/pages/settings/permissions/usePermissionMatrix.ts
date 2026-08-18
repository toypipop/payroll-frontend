import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../api/axiosInstance";

export const dataScopeOptions = [
    { id: "Own", name: "Own Data Only" },
    { id: "Department", name: "Department Scope" },
    { id: "Companies", name: "Full Companies" },
];

// usePermissionMatrix owns everything the matrix reads and writes: the roles list, the module tree, and the editable rows for the selected role.
export const usePermissionMatrix = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [moduleTree, setModuleTree] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch module tree once — same source as the Sidebar
    useEffect(() => {
        api.get("/modules").then(res => {
            const all = res.data;
            const tree = all
                .filter(m => !m.parent_id)
                .sort((a, b) => a.order - b.order)
                .map(parent => ({
                    ...parent,
                    children: all
                        .filter(c => c.parent_id === parent.id)
                        .sort((a, b) => a.order - b.order),
                }));
            setModuleTree(tree);
        }).catch(err => console.error("Load Modules Error", err));
    }, []);

    const selectRole = useCallback(async (role) => {
        if (!role) return;
        setSelectedRoles(role);
        setLoading(true);
        try {
            const res = await api.get(`/permissions/${role.id}`);
            const matrixData = res.data.modules.map((m) => {
                const access = res.data.access.find((a) => a.module_id === m.id);
                const allowedScopes = m.allowed_scopes || ["Companies"];
                const savedScope = access?.data_scope;
                return {
                    module_id: m.id,
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
                    data_scope: allowedScopes.includes(savedScope) ? savedScope : allowedScopes[0],
                };
            });
            setPermissions(matrixData);
        } catch (err) {
            console.error("Load Permissions Error", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            const res = await api.get("/roles");
            setRoles(res.data);
            if (res.data.length > 0) {
                selectRole(res.data[0]);
            }
        } catch (err) {
            console.error("Load Roles Error", err);
        }
    }, [selectRole]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const updateLocal = (index, field, value?) => {
        if (index === undefined) return;
        setPermissions((prev) => {
            const newData = [...prev];
            if (typeof field === "object") {
                newData[index] = { ...newData[index], ...field };
            } else {
                newData[index] = { ...newData[index], [field]: value };
            }
            return newData;
        });
    };

    const save = async () => {
        if (!selectedRoles) return;
        try {
            await api.post(`/permissions/${selectedRoles.id}`, permissions);
            alert("Permissions saved successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Save error");
        }
    };

    // Group permissions by sidebar category order
    const groupedPermissions = useMemo(() => {
        if (!moduleTree.length) return [];
        const permMap = new Map(permissions.map((p, idx) => [p.module_id, { ...p, _flatIdx: idx }]));
        const groups = [];

        // Render in the module tree's own order (driven by seed `Order`).
        for (const node of moduleTree) {
            if (node.is_category) {
                const items = (node.children || [])
                    .map(child => permMap.get(child.id))
                    .filter(Boolean);
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

    return { roles, selectedRoles, permissions, groupedPermissions, loading, selectRole, updateLocal, save };
};

export default usePermissionMatrix;
