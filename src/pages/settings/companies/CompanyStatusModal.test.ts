// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "../../../api/axiosInstance";
import CompanyStatusModal from "./CompanyStatusModal";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("company status confirmation", () => {
    it("does not allow changing a company whose status is missing", () => {
        const patch = vi.spyOn(api, "patch");
        render(createElement(CompanyStatusModal, { company: { id: 7 }, onSaved: vi.fn(), onClose: vi.fn() }));
        expect((screen.getByRole("button", { name: "Status unavailable" }) as HTMLButtonElement).disabled).toBe(true);
        expect(patch).not.toHaveBeenCalled();
    });
    it("requires confirmation and submits a status patch, then refreshes and closes", async () => {
        const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: { id: 7, is_active: false } });
        const saved = vi.fn().mockResolvedValue(undefined);
        const close = vi.fn();
        render(createElement(CompanyStatusModal, { company: { id: 7, name: "Example", is_active: true }, onSaved: saved, onClose: close }));
        expect(patch).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
        await waitFor(() => expect(close).toHaveBeenCalledOnce());
        expect(patch).toHaveBeenCalledWith("/companies/7/status", { is_active: false });
        expect(saved).toHaveBeenCalledOnce();
    });

    it("keeps the confirmation open on a failed reactivation", async () => {
        vi.spyOn(api, "patch").mockRejectedValue(new Error("offline"));
        const close = vi.fn();
        render(createElement(CompanyStatusModal, { company: { id: 7, is_active: false }, onSaved: vi.fn(), onClose: close }));
        fireEvent.click(screen.getByRole("button", { name: "Reactivate" }));
        await screen.findByRole("alert");
        expect(close).not.toHaveBeenCalled();
        expect((screen.getByRole("button", { name: "Reactivate" }) as HTMLButtonElement).disabled).toBe(false);
    });

    it("disables confirmation and cancellation while the request is pending", async () => {
        let resolveRequest!: (value: unknown) => void;
        const patch = vi.spyOn(api, "patch").mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
        const close = vi.fn();
        render(createElement(CompanyStatusModal, { company: { id: 7, is_active: false }, onSaved: vi.fn(), onClose: close }));
        fireEvent.click(screen.getByRole("button", { name: "Reactivate" }));
        expect((screen.getByRole("button", { name: "Saving..." }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.keyDown(window, { key: "Escape" });
        expect(close).not.toHaveBeenCalled();
        expect(patch).toHaveBeenCalledWith("/companies/7/status", { is_active: true });
        resolveRequest({ data: { id: 7, is_active: true } });
        await waitFor(() => expect(close).toHaveBeenCalledOnce());
    });
});
