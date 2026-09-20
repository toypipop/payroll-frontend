import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../src/components/common/Sidebar";
import type { AppModule } from "../../src/types/api";

const state = vi.hoisted(() => ({ modules: [] as AppModule[] }));
vi.mock("../../src/hooks/useModules", () => ({ useModules: () => ({ modules: state.modules, loading: false }) }));
afterEach(() => { cleanup(); state.modules = []; });
it("uses the database names and hierarchy for general pages", () => {
    state.modules = [
        { id: 1, module_key: "ModuleGeneral", module_name: "General", is_category: true },
        { id: 9, parent_id: 1, module_key: "DashboardPage", module_name: "Overview from DB", route_path: "/dashboard" },
        { id: 10, parent_id: 1, module_key: "MyPayslipsPage", module_name: "Payslips from DB", route_path: "/my-payslips" },
    ];
    render(<MemoryRouter initialEntries={["/dashboard"]}><Sidebar /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Overview from DB" }).getAttribute("href")).toBe("/dashboard");
    expect(screen.getByRole("link", { name: "Payslips from DB" }).getAttribute("href")).toBe("/my-payslips");
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
});
it("does not invent sidebar entries missing from the authorized modules", () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(screen.queryByRole("link", { name: "My Payslips" })).toBeNull();
});
