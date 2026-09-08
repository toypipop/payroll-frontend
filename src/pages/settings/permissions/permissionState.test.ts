import { describe, expect, it } from "vitest";

import type { PermissionRow } from "./usePermissionMatrix";
import { hasPermissionChanges, rolesForCompany } from "./permissionState";

const row = (overrides: Partial<PermissionRow> = {}): PermissionRow => ({
    module_id: 1,
    is_category: false,
    module_key: "EmployeesListPage",
    module_name: "Employees",
    companies_name: "Acme",
    allowed_actions: ["VIEW"],
    allowed_scopes: ["Companies"],
    actions_atomic: false,
    can_view: false,
    can_create: false,
    can_edit: false,
    can_delete: false,
    data_scope: "Companies",
    ...overrides,
});

describe("permission state helpers", () => {
    it("filters roles by their owning company without hiding all roles", () => {
        const roles = [
            { id: 1, companies_id: 10, roles_name: "Admin" },
            { id: 2, companies_id: 20, roles_name: "Manager" },
        ];
        expect(rolesForCompany(roles, "all")).toHaveLength(2);
        expect(rolesForCompany(roles, "20").map((role) => role.roles_name)).toEqual(["Manager"]);
    });

    it("detects permission changes but ignores capability-only fields", () => {
        const saved = [row()];
        expect(hasPermissionChanges(saved, [{ ...row(), module_name: "Renamed module" }])).toBe(false);
        expect(hasPermissionChanges(saved, [row({ can_view: true })])).toBe(true);
    });
});
