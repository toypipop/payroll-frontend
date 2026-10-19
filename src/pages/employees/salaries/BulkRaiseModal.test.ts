// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import BulkRaiseModal from "./BulkRaiseModal";
import api from "../../../api/axiosInstance";

vi.mock("../../../api/axiosInstance", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const props = {
    isOpen: true, onClose: vi.fn(), onApplied: vi.fn(),
    companies: [{ id: 1, name: "Company One" }, { id: 2, name: "Company Two" }],
};
beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(api.get).mockResolvedValue({ data: [
        { id: 1, companies_id: 1, employees_code: "A", first_name: "Alpha", last_name: "Test", is_active: true },
        { id: 2, companies_id: 2, employees_code: "B", first_name: "Beta", last_name: "Test", is_active: true },
        { id: 3, companies_id: 2, employees_code: "C", first_name: "Inactive", last_name: "Test", is_active: false },
    ] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("explains an empty selection on Preview and clears the message when an employee is selected", async () => {
    render(createElement(BulkRaiseModal, props));
    const checkbox = await screen.findByRole("checkbox", { name: "Select Alpha Test" });
    expect(screen.queryByText("Select at least one employee before previewing.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Select at least one employee before previewing.").getAttribute("role")).toBe("alert");
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.click(checkbox);
    expect(screen.queryByText("Select at least one employee before previewing.")).toBeNull();
});

it("can clear the company filter and restores all accessible active employees without keeping selections", async () => {
    render(createElement(BulkRaiseModal, props));
    await screen.findByRole("checkbox", { name: "Select Alpha Test" });
    fireEvent.click(screen.getByRole("button", { name: "All companies" }));
    fireEvent.mouseDown(within(document.getElementById("select-portal-dropdown")!).getByText("Company One"));
    expect(screen.queryByRole("checkbox", { name: "Select Beta Test" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Alpha Test" }));
    fireEvent.click(screen.getByRole("button", { name: "Company One" }));
    fireEvent.mouseDown(within(document.getElementById("select-portal-dropdown")!).getByText("All companies"));
    expect(screen.getByRole("checkbox", { name: "Select Beta Test" })).toBeTruthy();
    expect((screen.getByRole("checkbox", { name: "Select Alpha Test" }) as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByRole("checkbox", { name: "Select Inactive Test" })).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(1);
});
