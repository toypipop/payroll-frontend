import type { CSSProperties } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import usePermissionMatrix, { dataScopeOptions } from "./permissions/usePermissionMatrix";
import PermissionMatrix from "./permissions/PermissionMatrix";

const emptyStateStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    padding: "40px",
    color: "var(--text-subtle)",
    textAlign: "center"
};

const PermissionSettings = () => {
    const { roles, selectedRoles, permissions, groupedPermissions, loading, selectRole, updateLocal, save } = usePermissionMatrix();

    return (
        <div className="permission-settings">
            <PageHeader
                title="System Permissions"
                actionButton={
                    <Button onClick={save} disabled={!selectedRoles}>
                        Save Permissions
                    </Button>
                }
            />

            <div className="grid grid-cols-[300px_1fr] gap-6">
                {/* Left Panel: Available Roles */}
                <Card title="Available Roles">
                    <div style={{ display: "flex", flexFlow: "column", gap: "8px" }}>
                        {roles.length > 0 ? (
                            roles.map((role) => (
                                <div
                                    key={role.id}
                                    onClick={() => selectRole(role)}
                                    style={{
                                        padding: "16px",
                                        cursor: "pointer",
                                        borderRadius: "8px",
                                        border: selectedRoles?.id === role.id ? "1px solid var(--primary-color)" : "1px solid var(--border-muted)",
                                        backgroundColor: selectedRoles?.id === role.id ? "var(--primary-subtle)" : "white",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div className="font-semibold text-sidebar-line">
                                        {role.roles_name}
                                    </div>
                                    <div className="text-[12px] text-muted mt-[4px]">
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
                <Card title={`Mapping: ${selectedRoles?.roles_name || ""}`} className="p-0">
                    {loading ? (
                        <div style={emptyStateStyle}>Loading Matrix...</div>
                    ) : !selectedRoles ? (
                        <div style={emptyStateStyle}>Select a role to manage permissions.</div>
                    ) : (
                        <PermissionMatrix
                            permissions={permissions}
                            groupedPermissions={groupedPermissions}
                            dataScopeOptions={dataScopeOptions}
                            handleUpdateLocal={updateLocal}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PermissionSettings;
