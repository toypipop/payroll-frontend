// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuditLogDetailsModal, { type AuditLogRow } from "./AuditLogDetailsModal";

describe("AuditLogDetailsModal", () => {
    it("shows audit metadata and readable snapshot values without loading current records", () => {
        const entry: AuditLogRow = {
            id: 7,
            occurred_at: "2026-09-14T04:03:00Z",
            actor_name_snapshot: "System Admin",
            event_type: "salary.created",
            entity_type: "employee",
            entity_id: 42,
            summary: "Salary record created",
            reason: "",
            before_data: {},
            after_data: { base_salary: 30000, employees_id: 42 },
        };

        render(createElement(AuditLogDetailsModal, { entry, onClose: vi.fn() }));

        expect(screen.getByText("Audit Details")).toBeTruthy();
        expect(screen.getByText("Name unavailable in this audit snapshot")).toBeTruthy();
        expect(screen.getByText("Changed to")).toBeTruthy();
        expect(screen.getByText("Base Salary")).toBeTruthy();
        expect(screen.getByText("30,000")).toBeTruthy();
        expect(screen.queryByText("Raw data")).toBeNull();
    });
});
