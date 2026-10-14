// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuditLogDetailsModal, { type AuditLogRow } from "./AuditLogDetailsModal";

afterEach(cleanup);
const show = (event_type: string, before_data: AuditLogRow["before_data"], after_data: AuditLogRow["after_data"]) => render(createElement(AuditLogDetailsModal, {
    onClose: vi.fn(), entry: {
        id: 7, occurred_at: "2026-09-14T04:03:00Z", actor_name_snapshot: "Admin",
        event_type, entity_type: "employee", entity_id: 42, summary: "Record updated",
        reason: "", before_data, after_data,
    },
}));

describe("audit snapshot JSON", () => {
    it.each(["permission.updated", "employee.updated", "salary.created", "future.event"])("renders stored JSON consistently for %s", (event) => {
        const before = { amount: 0, enabled: false, missing: null, empty: "", items: [] };
        const after = { items: [{ module_id: 10, nested: { can_edit: true } }], amount: 30000 };
        show(event, before, after);
        expect(screen.getByLabelText("Changed from JSON").textContent).toBe(JSON.stringify(before, null, 2));
        expect(screen.getByLabelText("Changed to JSON").textContent).toBe(JSON.stringify(after, null, 2));
    });

    it("distinguishes absent snapshots from explicitly empty objects", () => {
        show("employee.created", null, {});
        expect(screen.getByText("No snapshot recorded.")).toBeTruthy();
        expect(screen.getByLabelText("Changed to JSON").textContent).toBe("{}");
    });

    it("renders HTML as text and retains historical values", () => {
        const value = { note: '<img src=x onerror="alert(1)">', first_name: "Historical name" };
        const { container } = show("employee.updated", undefined, value);
        expect(screen.getByLabelText("Changed to JSON").textContent).toBe(JSON.stringify(value, null, 2));
        expect(container.querySelector("img")).toBeNull();
        expect(screen.getByText("Historical name")).toBeTruthy();
    });
});
