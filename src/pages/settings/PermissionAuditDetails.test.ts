// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuditLogDetailsModal, { type AuditLogRow } from "./AuditLogDetailsModal";

afterEach(cleanup);

const grant = (module_id: number, can_edit = false, data_scope = "Own") => ({
    module_id, can_view: true, can_create: false, can_edit, can_delete: false, data_scope,
});
const show = (before_data: AuditLogRow["before_data"], after_data: AuditLogRow["after_data"]) => {
    render(createElement(AuditLogDetailsModal, { onClose: vi.fn(), entry: {
        id: 9, occurred_at: "2026-10-14T01:00:00Z", actor_name_snapshot: "Admin",
        event_type: "permission.updated", entity_type: "role", entity_id: 8,
        summary: "Role permissions updated", reason: "", before_data, after_data,
    } }));
};

describe("permission audit details", () => {
    it("shows changed actions and scope even when module counts are equal, ignoring array order", () => {
        show(
            { permission_count: 2, permissions: [grant(11), grant(10)] },
            { permission_count: 2, permissions: [grant(10, true, "Department"), grant(11)] },
        );
        const table = screen.getByRole("table", { name: "Module #10" });
        expect(within(table).getByRole("row", { name: "Edit No Yes" })).toBeTruthy();
        expect(within(table).getByRole("row", { name: "Scope Own Department" })).toBeTruthy();
        expect(screen.queryByRole("table", { name: "Module #11" })).toBeNull();
        expect(screen.getAllByText("Configured modules")).toHaveLength(2);
        expect(screen.queryByText("Permission Count")).toBeNull();
    });

    it("distinguishes legacy missing snapshots from an explicitly empty grant list", () => {
        show({ permission_count: 1 }, { permission_count: 1, permissions: [grant(10)] });
        expect(screen.getByText(/Before: detailed permissions were not recorded/)).toBeTruthy();
        expect(within(screen.getByRole("table")).getByRole("row", { name: "View Not recorded Yes" })).toBeTruthy();
        expect(screen.queryByText("Not configured")).toBeNull();
    });

    it("shows removed and added module grants without treating absent rows as false flags", () => {
        show({ permissions: [grant(10)] }, { permissions: [grant(12)] });
        expect(within(screen.getByRole("table", { name: "Module #10" }))
            .getByRole("row", { name: "View Yes Not configured" })).toBeTruthy();
        expect(within(screen.getByRole("table", { name: "Module #12" }))
            .getByRole("row", { name: "View Not configured Yes" })).toBeTruthy();
    });

    it("reports malformed or duplicate snapshot rows instead of claiming no changes", () => {
        show({ permissions: [grant(10), grant(10)] }, { permissions: [{ module_id: 10, can_edit: "false" }] });
        expect(screen.getByText(/Before: recorded permission details are invalid/)).toBeTruthy();
        expect(screen.getByText(/After: recorded permission details are invalid/)).toBeTruthy();
        expect(screen.queryByText("No permission changes recorded.")).toBeNull();
    });

    it("recognizes unchanged and empty snapshots", () => {
        show({ permission_count: 0, permissions: [] }, { permission_count: 0, permissions: [] });
        expect(screen.getByText("No permission changes recorded.")).toBeTruthy();
    });
});
