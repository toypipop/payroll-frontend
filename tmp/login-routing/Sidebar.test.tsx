import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../src/components/common/Sidebar";

vi.mock("../../src/hooks/useModules", () => ({ useModules: () => ({ modules: [], loading: false }) }));
afterEach(cleanup);
it("keeps universal navigation visible without module permissions", () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard");
    expect(screen.getByRole("link", { name: "My Payslips" }).getAttribute("href")).toBe("/my-payslips");
});
