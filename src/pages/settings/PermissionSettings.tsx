import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import CheckboxField from "../../components/common/CheckboxField";
import SelectField from "../../components/common/SelectField";
import Table from "../../components/common/Table";

const ALL_OR_NOTHING_MODULES = new Set(["CompaniesPage", "MasterBankPage"]);

const PermissionSettings = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [moduleTree, setModuleTree] = useState([]);
    const [loading, setLoading] = useState(false);

    const dataScopeOptions = useMemo(() => [
        { id: "Own", name: "Own Data Only" },
        { id: "Department", name: "Department Scope" },
        { id: "Companies", name: "Full Companies" },
        { id: "All", name: "Full Organization" },
    ], []);

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

    const handleSelectRoles = useCallback(async (role) => {
        if (!role) return;
        setSelectedRoles(role);
        setLoading(true);
        try {
            const res = await api.get(`/permissions/${role.id}`);
            const matrixData = res.data.modules.map((m) => {
                const access = res.data.access.find((a) => a.module_id === m.id);
                return {
                    module_id: m.id,
                    module_key: m.module_key,
                    module_name: m.module_name,
                    companies_name: role.companies?.name || "System",
                    can_view: Boolean(access?.can_view),
                    can_create: Boolean(access?.can_create),
                    can_edit: Boolean(access?.can_edit),
                    can_delete: Boolean(access?.can_delete),
                    data_scope: access?.data_scope || "Own",
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
                handleSelectRoles(res.data[0]);
            }
        } catch (err) {
            console.error("Load Roles Error", err);
        }
    }, [handleSelectRoles]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleUpdateLocal = (index, field, value?) => {
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

    const onSave = async () => {
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
                if (item) groups.push({ categoryName: null, items: [item] });
            }
        }

        // Catch any orphaned permissions not found in the tree
        const seen = new Set(groups.flatMap(g => g.items.map(i => i.module_id)));
        const orphans = permissions
            .map((p, idx) => ({ ...p, _flatIdx: idx }))
            .filter(p => !seen.has(p.module_id));
        if (orphans.length > 0) groups.push({ categoryName: "Other", items: orphans });

        return groups;
    }, [moduleTree, permissions]);

    const emptyStateStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
        padding: "40px",
        color: "#9ca3af",
        textAlign: "center"
    };
    
    return (
        <div className="permission-settings">
            <PageHeader
                title="System Permissions"
                actionButton={
                    <Button onClick={onSave} disabled={!selectedRoles} style={{ width: "auto" }}>
                        Save Permissions
                    </Button>
                }
            />

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
                {/* Left Panel: Available Roles */}
                <Card title="Available Roles">
                    <div style={{ display: "flex", flexFlow: "column", gap: "8px" }}>
                        {roles.length > 0 ? (
                            roles.map((role) => (
                                <div
                                    key={role.id}
                                    onClick={() => handleSelectRoles(role)}
                                    style={{
                                        padding: "16px",
                                        cursor: "pointer",
                                        borderRadius: "8px",
                                        border: selectedRoles?.id === role.id ? "1px solid #4f46e5" : "1px solid #e5e7eb",
                                        backgroundColor: selectedRoles?.id === role.id ? "#f5f3ff" : "white",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                                        {role.roles_name}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                        🏢 {role.companies?.name || "Global / System"}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={emptyStateStyle}>
                                No roles found.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right Panel: Permission Matrix grouped by category */}
                <Card title={`Mapping: ${selectedRoles?.roles_name || ""}`} style={{ padding: 0 }}>
                    {loading ? (
                        <div style={emptyStateStyle}>Loading Matrix...</div>
                    ) : !selectedRoles ? (
                        <div style={emptyStateStyle}>Select a role to manage permissions.</div>
                    ) : (
                        <PermissionMatrix 
                            permissions={permissions}
                            groupedPermissions={groupedPermissions}
                            dataScopeOptions={dataScopeOptions}
                            handleUpdateLocal={handleUpdateLocal}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

const categoryRowStyle = {
    padding: "8px 20px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6259ca",
    backgroundColor: "#f0effe",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: "1px solid #e2e8f0",
    borderTop: "1px solid #e2e8f0",
};

// Permission matrix with table structure
const PermissionMatrix = ({ permissions, groupedPermissions, dataScopeOptions, handleUpdateLocal }) => {
    const flatItems = groupedPermissions.flatMap((group) =>
        (group.items || []).map((item, idx) => ({
            ...item,
            _categoryName: group.categoryName,
            _categoryStart: Boolean(group.categoryName) && idx === 0,
        }))
    );

    const columns = [
        {
            label: "Module",
            render: (item) => item.module_name,
        },
        {
            label: "View",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (ALL_OR_NOTHING_MODULES.has(item.module_key)) {
                    const allGranted = permissions[item._flatIdx]?.can_view && permissions[item._flatIdx]?.can_create && permissions[item._flatIdx]?.can_edit && permissions[item._flatIdx]?.can_delete;
                    return (
                        <CheckboxField
                            checked={Boolean(allGranted)}
                            onChange={(e) => handleUpdateLocal(item._flatIdx, { can_view: e.target.checked, can_create: e.target.checked, can_edit: e.target.checked, can_delete: e.target.checked })}
                        />
                    );
                }
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_view || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_view", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Create",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (ALL_OR_NOTHING_MODULES.has(item.module_key)) return null;
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_create || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_create", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Edit",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (ALL_OR_NOTHING_MODULES.has(item.module_key)) return null;
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_edit || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_edit", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Delete",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (ALL_OR_NOTHING_MODULES.has(item.module_key)) return null;
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_delete || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_delete", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Data Scope",
            headerStyle: { width: "32%" },
            render: (item) => (
                <SelectField
                    options={dataScopeOptions}
                    value={permissions[item._flatIdx]?.data_scope || "Own"}
                    onChange={(e) => handleUpdateLocal(item._flatIdx, "data_scope", e.target.value)}
                    style={{ marginBottom: 0 }}
                />
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            data={flatItems}
            getRowKey={(row) => row.module_id}
            renderBeforeRow={(row) => {
                if (!row._categoryStart) return null;
                return (
                    <tr>
                        <td colSpan={columns.length} style={categoryRowStyle}>
                            {row._categoryName}
                        </td>
                    </tr>
                );
            }}
        />
    );
};

export default PermissionSettings;
