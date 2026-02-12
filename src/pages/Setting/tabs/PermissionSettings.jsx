import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import api from "../../../api/axiosInstance";
import PageHeader from "../../../components/common/PageHeader";
import Card from "../../../components/common/Card";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import CheckboxField from "../../../components/common/CheckboxField";
import SelectField from "../../../components/common/SelectField";

const PermissionSettings = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const dataScopeOptions = [
        { id: "OWN", name: "Own Data Only" },
        { id: "DEPARTMENT", name: "Department Scope" },
        { id: "ALL", name: "Full Organization" },
    ];

    const handleSelectRole = useCallback(async (role) => {
        setSelectedRole(role);
        setLoading(true);
        try {
            const res = await api.get(`/roles/${role.id}/permissions`);
            // Force new object creation for each module (English Comment)
            const matrixData = res.data.modules.map((m) => {
                const access = res.data.access.find(
                    (a) => a.module_id === m.id,
                );
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
            if (res.data.length > 0) handleSelectRole(res.data[0]);
        } catch (err) {
            console.error("Load Roles Error", err);
        }
    }, [handleSelectRole]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleUpdateLocal = (index, field, value) => {
        // Check if index is valid (English Comment)
        if (index === undefined) return;

        setPermissions((prev) => {
            const newData = [...prev];
            // Create new object reference for this specific row (English Comment)
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const onSave = async () => {
        try {
            await api.post(
                `/roles/${selectedRole.id}/permissions`,
                permissions,
            );
            alert("Permissions saved successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Save error");
        }
    };
    // Use useMemo to prevent stale closures in Table render
    const columns = useMemo(
        () => [
            { label: "MODULE", key: "module_name", width: "30%" }, 
            {
                label: "VIEW",
                width: "8%", // Reduced from 10%
                render: (row, idx) => (
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
                width: "8%", // Reduced from 10%
                render: (row, idx) => (
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
                render: (row, idx) => (
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
                render: (row, idx) => (
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
                width: "38%", // Increased to fill remaining space
                render: (row, idx) => (
                    <SelectField
                        options={dataScopeOptions}
                        value={permissions[idx]?.data_scope || "OWN"}
                        onChange={(e) =>
                            handleUpdateLocal(idx, "data_scope", e.target.value)
                        }
                        style={{ marginBottom: 0 }}
                    />
                ),
            },
        ],
        [dataScopeOptions, permissions],
    );

    return (
        <div className="permission-settings">
            <PageHeader
                title="System Permissions"
                actionButton={
                    <Button onClick={onSave} style={{ width: "auto" }}>
                        Save Permissions
                    </Button>
                }
            />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "24px",
                }}
            >
                <Card title="Available Roles">
                    <div
                        style={{
                            display: "flex",
                            flexFlow: "column",
                            gap: "8px",
                        }}
                    >
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                style={{
                                    padding: "16px",
                                    cursor: "pointer",
                                    borderRadius: "8px",
                                    border:
                                        selectedRole?.id === role.id
                                            ? "1px solid #4f46e5"
                                            : "1px solid #e5e7eb",
                                    backgroundColor:
                                        selectedRole?.id === role.id
                                            ? "#f5f3ff"
                                            : "white",
                                    transition: "all 0.2s",
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: "600",
                                        color: "#1f2937",
                                    }}
                                >
                                    {role.role_name}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card
                    title={`Mapping: ${selectedRole?.role_name || ""}`}
                    style={{ padding: 0 }}
                >
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            Loading Matrix...
                        </div>
                    ) : (
                        <Table columns={columns} data={permissions} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PermissionSettings;
