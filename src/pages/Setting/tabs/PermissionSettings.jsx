import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../api/axiosInstance";
import PageHeader from "../../../components/common/PageHeader";
import Card from "../../../components/common/Card";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import CheckboxField from "../../../components/common/CheckboxField";
import SelectField from "../../../components/common/SelectField";

const PermissionSettings = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);

    const dataScopeOptions = useMemo(() => [
        { id: "Own", name: "Own Data Only" },
        { id: "Department", name: "Department Scope" },
        { id: "Company", name: "Full Company" },
        { id: "All", name: "Full Organization" },
    ], []);

    const handleSelectRoles = useCallback(async (role) => {
        if (!role) return;
        setSelectedRoles(role);
        setLoading(true);
        try {
            const res = await api.get(`/roles/${role.id}/permissions`);
            const matrixData = res.data.modules.map((m) => {
                const access = res.data.access.find((a) => a.module_id === m.id);
                return {
                    module_id: m.id,
                    module_name: m.module_name,
                    can_view: Boolean(access?.can_view),
                    can_create: Boolean(access?.can_create),
                    can_edit: Boolean(access?.can_edit),
                    can_delete: Boolean(access?.can_delete),
                    data_scope: access?.data_scope || "OWN",
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

    const handleUpdateLocal = (index, field, value) => {
        if (index === undefined) return;
        setPermissions((prev) => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const onSave = async () => {
        if (!selectedRoles) return;
        try {
            await api.post(`/roles/${selectedRoles.id}/permissions`, permissions);
            alert("Permissions saved successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Save error");
        }
    };

    const columns = useMemo(() => [
        { label: "MODULE", key: "module_name", width: "30%" },
        {
            label: "VIEW",
            width: "8%",
            render: (_, idx) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <CheckboxField
                        checked={permissions[idx]?.can_view || false}
                        onChange={(e) => handleUpdateLocal(idx, "can_view", e.target.checked)}
                    />
                </div>
            ),
        },
        {
            label: "CREATE",
            width: "8%",
            render: (_, idx) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <CheckboxField
                        checked={permissions[idx]?.can_create || false}
                        onChange={(e) => handleUpdateLocal(idx, "can_create", e.target.checked)}
                    />
                </div>
            ),
        },
        {
            label: "EDIT",
            width: "8%",
            render: (_, idx) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <CheckboxField
                        checked={permissions[idx]?.can_edit || false}
                        onChange={(e) => handleUpdateLocal(idx, "can_edit", e.target.checked)}
                    />
                </div>
            ),
        },
        {
            label: "DELETE",
            width: "8%",
            render: (_, idx) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <CheckboxField
                        checked={permissions[idx]?.can_delete || false}
                        onChange={(e) => handleUpdateLocal(idx, "can_delete", e.target.checked)}
                    />
                </div>
            ),
        },
        {
            label: "DATA SCOPE",
            width: "38%",
            render: (_, idx) => (
                <SelectField
                    options={dataScopeOptions}
                    value={permissions[idx]?.data_scope || "OWN"}
                    onChange={(e) => handleUpdateLocal(idx, "data_scope", e.target.value)}
                    style={{ marginBottom: 0 }}
                />
            ),
        },
    ], [dataScopeOptions, permissions]);

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
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
                                No roles found.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right Panel: Mapping Matrix */}
                <Card title={`Mapping: ${selectedRoles?.roles_name || ""}`} style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>Loading Matrix...</div>
                    ) : selectedRoles ? (
                        <Table columns={columns} data={permissions} />
                    ) : (
                        <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                            Select a role to manage permissions.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PermissionSettings;