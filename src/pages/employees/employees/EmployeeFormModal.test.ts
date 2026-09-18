// @vitest-environment jsdom
import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EmployeeFormModal from "./EmployeeFormModal";
import api from "../../../api/axiosInstance";

vi.mock("../../../api/axiosInstance", () => ({ default: { put: vi.fn(), post: vi.fn() } }));
vi.mock("../../../hooks/useModulePermission", () => ({ useModulePermission: () => false }));

const employee = { id: 9, companies_id: 7, employees_code: "E009", first_name: "Test", last_name: "Employee", email: "employee@example.test", dept_id: 11, pos_id: 12, roles_id: 13, employment_type_id: 14, is_active: true };
const masters = {
    masterCompanies: [{ id: 7, name: "Company Seven" }, { id: 8, name: "Company Eight" }],
    masterDepts: [{ id: 11, companies_id: 7, name: "Engineering" }],
    masterPos: [{ id: 12, companies_id: 7, name: "Developer" }],
    masterRoles: [{ id: 13, companies_id: 7, name: "Staff" }],
    masterEmploymentTypes: [{ id: 14, companies_id: 7, name: "Full Time" }],
    masterBanks: [],
};
const props = { ...masters, homeCompanyId: "8", editing: employee, isOpen: true, onClose: vi.fn(), onSaved: vi.fn() };
beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function expectDefaultsAndSave() {
    for (const name of ["Engineering", "Developer", "Staff", "Full Time"]) {
        await screen.findByRole("button", { name });
    }
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/employees/9", expect.objectContaining({ dept_id: 11, pos_id: 12, roles_id: 13, employment_type_id: 14, companies_id: 7 })));
}

it("preserves edit defaults on first open when the employee belongs to another company", async () => {
    const view = render(createElement(EmployeeFormModal, { ...props, isOpen: false, editing: null }));
    view.rerender(createElement(EmployeeFormModal, props));
    await expectDefaultsAndSave();
});

it("preserves edit defaults when options arrive after the first open", async () => {
    const view = render(createElement(StrictMode, null, createElement(EmployeeFormModal, { ...props, masterCompanies: [], masterDepts: [], masterPos: [], masterRoles: [], masterEmploymentTypes: [] })));
    view.rerender(createElement(StrictMode, null, createElement(EmployeeFormModal, props)));
    await expectDefaultsAndSave();
});

it("still clears dependent selections when the user changes company in Add", () => {
    render(createElement(EmployeeFormModal, { ...props, editing: null, homeCompanyId: "7" }));
    for (const [label, name] of [["Department", "Engineering"], ["Position", "Developer"], ["System Roles", "Staff"], ["Employment Type", "Full Time"]]) {
        fireEvent.click(screen.getByRole("button", { name: `Select ${label}` }));
        fireEvent.mouseDown(within(document.getElementById("select-portal-dropdown")!).getByText(name));
    }
    fireEvent.click(screen.getByRole("button", { name: "Company Seven" }));
    fireEvent.mouseDown(within(document.getElementById("select-portal-dropdown")!).getByText("Company Eight"));
    for (const field of ["dept_id", "pos_id", "roles_id", "employment_type_id"]) {
        expect((document.querySelector(`select[name="${field}"]`) as HTMLSelectElement).value).toBe("");
    }
    fireEvent.click(screen.getByRole("button", { name: "Company Eight" }));
    fireEvent.mouseDown(within(document.getElementById("select-portal-dropdown")!).getByText("Company Seven"));
    for (const name of ["Engineering", "Developer", "Staff", "Full Time"]) {
        expect(screen.queryByRole("button", { name })).toBeNull();
    }
});

it("preserves defaults when React schedules the initial reset across browser tasks", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = false;
    try {
        root.render(createElement(EmployeeFormModal, { ...props, isOpen: false, editing: null }));
        await new Promise(resolve => setTimeout(resolve, 50));
        root.render(createElement(EmployeeFormModal, props));
        await new Promise(resolve => setTimeout(resolve, 100));
        for (const name of ["Engineering", "Developer", "Staff", "Full Time"]) {
            expect(screen.queryByRole("button", { name })).not.toBeNull();
        }
    } finally {
        root.unmount();
        container.remove();
        environment.IS_REACT_ACT_ENVIRONMENT = previous;
    }
});
