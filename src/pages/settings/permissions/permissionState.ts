import type { Role } from "../../../types/domain";
import type { PermissionRow } from "./usePermissionMatrix";

type SavedPermission = Pick<PermissionRow, "module_id" | "can_view" | "can_create" | "can_edit" | "can_delete" | "data_scope">;

const savedShape = (row: PermissionRow): SavedPermission => ({
    module_id: row.module_id,
    can_view: row.can_view,
    can_create: row.can_create,
    can_edit: row.can_edit,
    can_delete: row.can_delete,
    data_scope: row.data_scope,
});

export const permissionSnapshot = (permissions: PermissionRow[]) => permissions
    .filter((row) => !row.is_category)
    .map(savedShape);

export const hasPermissionChanges = (saved: PermissionRow[], current: PermissionRow[]) =>
    JSON.stringify(permissionSnapshot(saved)) !== JSON.stringify(permissionSnapshot(current));

export const rolesForCompany = (roles: Role[], companyID: string) =>
    companyID === "all" ? roles : roles.filter((role) => String(role.companies_id) === companyID);
