// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../api/axiosInstance";
import AttendanceConfigModal from "./AttendanceConfigModal";

vi.mock("../../../api/axiosInstance", () => ({ default: { post: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.post).mockResolvedValue({ data: {} }); });
afterEach(cleanup);
const props = { isOpen: true, onClose: vi.fn(), onSaved: vi.fn() };
const company = { id: 1, name: "Test", attendance_config: { late_rate_per_minute: 0, absent_rate_per_day: 0, overtime_rate_per_minute: 0, extra_rate_per_day: 0, is_late_deduction_enabled: false, is_absent_deduction_enabled: false, is_overtime_earnings_enabled: false, is_extra_earnings_enabled: false } };

describe("attendance config validation", () => {
    it("saves zero rates and disabled flags unchanged", async () => {
        render(createElement(AttendanceConfigModal, { ...props, company }));
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith("/attendance/config", expect.objectContaining({ companies_id: 1, late_rate_per_minute: 0, absent_rate_per_day: 0, overtime_rate_per_minute: 0, extra_rate_per_day: 0, is_late_deduction_enabled: false, is_absent_deduction_enabled: false })));
        expect(props.onClose).toHaveBeenCalled();
    });
    it("blocks a negative OT rate and lets the user correct it", async () => {
        render(createElement(AttendanceConfigModal, { ...props, company }));
        const rate = document.querySelector('input[name="overtime_rate_per_minute"]') as HTMLInputElement;
        fireEvent.change(rate, { target: { value: "-1" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await screen.findByText("Rate must be at least 0");
        expect(api.post).not.toHaveBeenCalled();
        expect(props.onClose).not.toHaveBeenCalled();
        expect(rate.value).toBe("-1");
        fireEvent.change(rate, { target: { value: "0" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith("/attendance/config", expect.objectContaining({ overtime_rate_per_minute: 0 })));
    });
});
