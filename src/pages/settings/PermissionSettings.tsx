import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import usePermissionMatrix, { dataScopeOptions } from "./permissions/usePermissionMatrix";
import PermissionMatrix from "./permissions/PermissionMatrix";

const emptyState = "flex min-h-[300px] flex-col items-center justify-center p-10 text-center text-subtle";

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
                    <div className="flex flex-col gap-2">
                        {roles.length > 0 ? (
                            roles.map((role) => (
                                <div
                                    key={role.id}
                                    onClick={() => selectRole(role)}
                                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                                        selectedRoles?.id === role.id
                                            ? "border-primary bg-primary-subtle"
                                            : "border-line-muted bg-white"
                                    }`}
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
                            <div className={emptyState}>
                                No roles found.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right Panel: Permission Matrix grouped by category */}
                <Card title={`Mapping: ${selectedRoles?.roles_name || ""}`} className="p-0">
                    {loading ? (
                        <div className={emptyState}>Loading Matrix...</div>
                    ) : !selectedRoles ? (
                        <div className={emptyState}>Select a role to manage permissions.</div>
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
