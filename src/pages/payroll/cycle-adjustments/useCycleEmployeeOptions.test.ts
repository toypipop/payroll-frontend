// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../api/axiosInstance";
import useCycleEmployeeOptions from "./useCycleEmployeeOptions";
import type { CycleEmployeeOption } from "../../../types/api";

vi.mock("../../../api/axiosInstance", () => ({ default: { get: vi.fn() } }));
const get = vi.mocked(api.get);
const employee: CycleEmployeeOption = {
    id: 9, companies_id: 7, employees_code: "E009", first_name: "Test", last_name: "Employee",
};
function deferred() {
    let resolve!: (response: { data: CycleEmployeeOption[] }) => void;
    const promise = new Promise<{ data: CycleEmployeeOption[] }>((done) => { resolve = done; });
    return { promise, resolve };
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("cycle salary employee options", () => {
    it("waits until the modal is open and a cycle is selected", async () => {
        get.mockResolvedValue({ data: [employee] });
        const { result, rerender } = renderHook(
            ({ cycleId, open }) => useCycleEmployeeOptions(cycleId, open),
            { initialProps: { cycleId: "", open: true } },
        );
        expect(get).not.toHaveBeenCalled();
        rerender({ cycleId: "4", open: false });
        expect(get).not.toHaveBeenCalled();
        rerender({ cycleId: "4", open: true });
        await waitFor(() => expect(result.current.employees).toEqual([employee]));
        expect(get).toHaveBeenCalledWith("/payroll/cycles/4/employees/options", { signal: expect.any(AbortSignal) });
    });

    it("discards late responses after changing the cycle", async () => {
        const first = deferred();
        const second = deferred();
        get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        const { result, rerender } = renderHook(
            ({ cycleId }) => useCycleEmployeeOptions(cycleId, true),
            { initialProps: { cycleId: "4" } },
        );
        rerender({ cycleId: "5" });
        expect(result.current.employees).toEqual([]);
        expect(result.current.loading).toBe(true);
        await act(async () => second.resolve({ data: [{ ...employee, id: 10 }] }));
        await act(async () => first.resolve({ data: [employee] }));
        expect(result.current.employees.map((e) => e.id)).toEqual([10]);
        expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true);
    });

    it("refreshes on reopening so a newly disabled salary disappears", async () => {
        get.mockResolvedValueOnce({ data: [employee] }).mockResolvedValueOnce({ data: [] });
        const { result, rerender } = renderHook(
            ({ open }) => useCycleEmployeeOptions("4", open),
            { initialProps: { open: true } },
        );
        await waitFor(() => expect(result.current.employees).toEqual([employee]));
        rerender({ open: false });
        expect(result.current.employees).toEqual([]);
        rerender({ open: true });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.employees).toEqual([]);
        expect(get).toHaveBeenCalledTimes(2);
    });

    it("fails closed and supports retry without retaining previous options", async () => {
        get.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: [employee] });
        const { result } = renderHook(() => useCycleEmployeeOptions("4", true));
        await waitFor(() => expect(result.current.error).toBe("Could not load employees for this cycle."));
        expect(result.current.employees).toEqual([]);
        act(() => result.current.reload());
        await waitFor(() => expect(result.current.employees).toEqual([employee]));
        expect(result.current.error).toBe("");
    });
});
