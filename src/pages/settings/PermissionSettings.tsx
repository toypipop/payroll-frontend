import { useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import SelectField from "../../components/common/SelectField";
import usePermissionMatrix, { dataScopeOptions } from "./permissions/usePermissionMatrix";
import PermissionMatrix from "./permissions/PermissionMatrix";
import { rolesForCompany } from "./permissions/permissionState";
import { useModules } from "../../hooks/useModules";

const emptyState = "flex min-h-[300px] flex-col items-center justify-center p-10 text-center text-subtle";

const PermissionSettings = () => {
    const { roles, selectedRoles, permissions, groupedPermissions, loading, saving, isDirty, error, notice, selectRole, updateLocal, save, discardChanges } = usePermissionMatrix();
    const { refreshModules } = useModules();
    const [pendingRoleID, setPendingRoleID] = useState<string | null>(null);
    const companies = useMemo(() => {
        const seen = new Set<string>();
        return roles.flatMap((role) => {
            const id = role.companies_id;
            const name = role.companies?.name;
            if (id == null || !name || seen.has(String(id))) return [];
            seen.add(String(id));
            return [{ id: String(id), name }];
        });
    }, [roles]);
    const companyFilter = String(selectedRoles?.companies_id ?? companies[0]?.id ?? "");
    const filteredRoles = rolesForCompany(roles, companyFilter);
    const pendingRole = roles.find((role) => String(role.id) === pendingRoleID) ?? null;
    const enabledModules = permissions.filter((row) => !row.is_category && (row.can_view || row.can_create || row.can_edit || row.can_delete)).length;

    const savePermissions = async () => {
        if (await save()) await refreshModules();
    };

    const requestRole = (roleID: string | undefined) => {
        const role = roles.find((item) => String(item.id) === String(roleID));
        if (!role || role.id === selectedRoles?.id) return;
        if (isDirty) {
            setPendingRoleID(String(role.id));
            return;
        }
        void selectRole(role);
    };

    const discardAndSelect = () => {
        if (!pendingRole) return;
        discardChanges();
        setPendingRoleID(null);
        void selectRole(pendingRole);
    };

    return (
        <div className="permission-settings">
            <PageHeader
                title="System Permissions"
                actionButton={<Button onClick={savePermissions} disabled={!selectedRoles || !isDirty || saving}>{saving ? "Saving..." : "Save Permissions"}</Button>}
            />

            {error && <p role="alert" className="mb-4 text-danger">{error}</p>}
            {notice && <p role="status" className="mb-4 text-success">{notice}</p>}
            <div className="grid grid-cols-[300px_1fr] items-start gap-6">
                <Card title="Available Roles" className="sticky top-6 flex max-h-[calc(100vh-180px)] flex-col self-start">
                    <SelectField label="Company" value={companyFilter} onChange={(event) => requestRole(roles.find((role) => String(role.companies_id) === event.target.value)?.id?.toString())} options={companies} />
                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        <div className="flex flex-col gap-2">
                        {filteredRoles.length > 0 ? filteredRoles.map((role) => (
                            <button
                                type="button"
                                key={role.id}
                                onClick={() => requestRole(String(role.id))}
                                className={`rounded-lg border p-4 text-left transition-colors ${selectedRoles?.id === role.id ? "border-primary bg-primary-subtle" : "border-line-muted bg-card hover:border-control-line hover:bg-control-soft"}`}
                            >
                                <div className="font-semibold text-main">{role.roles_name}</div>
                                <div className="mt-1 text-xs text-muted">{role.companies?.name || "Company unavailable"}</div>
                            </button>
                        )) : <div className={emptyState}>No roles found for this company.</div>}
                        </div>
                    </div>
                </Card>

                <Card title={selectedRoles ? `Permissions for: ${selectedRoles.roles_name}` : "Permissions"} className="p-0">
                    {selectedRoles && <div className="flex min-h-16 items-center justify-between gap-4 border-b border-line-muted px-6 py-4">
                        <span className="text-sm font-medium text-muted">{selectedRoles.companies?.name || "Company unavailable"}</span>
                        <span className="shrink-0 rounded-full bg-control-soft px-3 py-1.5 text-xs font-semibold text-control">{enabledModules} modules enabled</span>
                    </div>}
                    {selectedRoles && isDirty && <div className="flex items-center justify-between border-b border-warning-line bg-warning-soft px-5 py-2 text-sm text-warning-text">
                        <span>Unsaved changes</span>
                        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={discardChanges} disabled={saving}>Discard changes</Button>
                    </div>}
                    {loading ? <div className={emptyState}>Loading permissions...</div>
                        : !selectedRoles ? <div className={emptyState}>Select a role to manage permissions.</div>
                            : <PermissionMatrix permissions={permissions} groupedPermissions={groupedPermissions} dataScopeOptions={dataScopeOptions} handleUpdateLocal={updateLocal} />}
                </Card>
            </div>

            <Modal
                isOpen={Boolean(pendingRole)}
                onClose={() => setPendingRoleID(null)}
                title="Discard unsaved changes?"
                footer={<>
                    <Button variant="ghost" onClick={() => setPendingRoleID(null)}>Keep editing</Button>
                    <Button variant="danger" onClick={discardAndSelect}>Discard and switch role</Button>
                </>}
            >
                <p className="text-main">Your changes for {selectedRoles?.roles_name} have not been saved.</p>
                <p className="mt-2 text-sm text-muted">Switching to {pendingRole?.roles_name} will discard them.</p>
            </Modal>
        </div>
    );
};

export default PermissionSettings;
