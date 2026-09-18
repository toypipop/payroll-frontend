// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../api/axiosInstance";
import CycleEarningFormModal from "../cycle-earnings/CycleEarningFormModal";
import CycleDeductionFormModal from "../cycle-deductions/CycleDeductionFormModal";

vi.mock("../../../api/axiosInstance", () => ({
    default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));
vi.mock("../../../hooks/useModulePermission", () => ({ useModulePermission: () => false }));

const employee = { id: 9, companies_id: 7, employees_code: "E009", first_name: "Test", last_name: "Employee" };
const sharedProps = {
    isOpen: true, onClose: vi.fn(), onSaved: vi.fn(),
    defaultCompanyId: "7", defaultCycleId: "4",
    companies: [{ id: 7, name: "Test Company" }],
    cycles: [{ id: 4, companies_id: 7, cycle_name: "September", is_closed: false }],
};
const editing = { id: 1, companies_id: 7, cycle_id: 4, employees_id: 9, amount: 100, employees: employee };
const forms = [
    {
        name: "earning", endpoint: "/cycle-earnings/1",
        render: () => render(createElement(CycleEarningFormModal, {
            ...sharedProps, editing: { ...editing, earning_type_id: 3 },
            earningTypes: [{ id: 3, companies_id: 7, name: "Bonus" }],
        })),
    },
    {
        name: "deduction", endpoint: "/cycle-deductions/1",
        render: () => render(createElement(CycleDeductionFormModal, {
            ...sharedProps, editing: { ...editing, deduction_type_id: 3 },
            deductionTypes: [{ id: 3, companies_id: 7, name: "Adjustment" }],
        })),
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe.each(forms)("$name salary eligibility", (form) => {
    it("preserves an eligible employee on edit after asynchronous options load", async () => {
        vi.mocked(api.get).mockResolvedValue({ data: [employee] });
        form.render();
        await waitFor(() => expect((screen.getByRole("button", { name: "Update" }) as HTMLButtonElement).disabled).toBe(false));
        fireEvent.click(screen.getByRole("button", { name: "Update" }));
        await waitFor(() => expect(api.put).toHaveBeenCalledWith(form.endpoint, expect.objectContaining({ employees_id: 9, cycle_id: 4, amount: 100 })));
        expect(sharedProps.onClose).toHaveBeenCalled();
    });

    it("shows the original employee but blocks saving when their salary is unavailable", async () => {
        vi.mocked(api.get).mockResolvedValue({ data: [] });
        form.render();
        await screen.findByText("No employees have an enabled salary effective in this payroll cycle.");
        expect(screen.getByRole("status").textContent).toContain("Test Employee");
        expect((screen.getByRole("button", { name: "Update" }) as HTMLButtonElement).disabled).toBe(true);
        expect(api.put).not.toHaveBeenCalled();
    });
});
