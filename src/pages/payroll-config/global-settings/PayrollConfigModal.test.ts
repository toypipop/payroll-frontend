// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../api/axiosInstance";
import PayrollConfigModal from "./PayrollConfigModal";

vi.mock("../../../api/axiosInstance", () => ({ default: { post: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.post).mockResolvedValue({ data: {} }); });
afterEach(cleanup);
const props = { isOpen: true, onClose: vi.fn(), onSaved: vi.fn() };

describe("payroll config round trip", () => {
    it("reopens zero values and posts them unchanged", async () => {
        render(createElement(PayrollConfigModal, { ...props, company: { id: 1, name: "Test", payroll_config: { sso_rate: 0, sso_max_amount: 0, sso_min_salary: 0, tax_calculation: "None" } } }));
        for (const field of ["sso_rate", "sso_max_amount", "sso_min_salary"]) {
            await waitFor(() => expect((document.querySelector('input[name="' + field + '"]') as HTMLInputElement).value).toBe("0"));
        }
        fireEvent.click(screen.getByRole("button", { name: "Save Config" }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith("/global", { companies_id: 1, sso_rate: 0, sso_max_amount: 0, sso_min_salary: 0, tax_calculation: "None" }));
        expect(props.onClose).toHaveBeenCalled();
    });
    it("blocks an invalid percentage and lets the user correct it", async () => {
        render(createElement(PayrollConfigModal, { ...props, company: { id: 1, name: "Test" } }));
        const rate = document.querySelector('input[name="sso_rate"]') as HTMLInputElement;
        await waitFor(() => expect(rate.value).toBe("5"));
        fireEvent.change(rate, { target: { value: "101" } });
        fireEvent.click(screen.getByRole("button", { name: "Save Config" }));
        await screen.findByText("SSO rate (%) must be at most 100");
        expect(api.post).not.toHaveBeenCalled();
        expect(props.onClose).not.toHaveBeenCalled();
        expect(rate.value).toBe("101");
        fireEvent.change(rate, { target: { value: "0" } });
        fireEvent.click(screen.getByRole("button", { name: "Save Config" }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith("/global", expect.objectContaining({ sso_rate: 0 })));
    });
});
