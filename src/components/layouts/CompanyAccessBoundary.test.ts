// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import api from "../../api/axiosInstance";
import CompanyAccessBoundary from "./CompanyAccessBoundary";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("removes stale content on an inactive company response and allows a fresh reload", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [{ id: 1 }] });
    render(createElement(MemoryRouter, null,
        createElement(CompanyAccessBoundary, null, createElement("div", null, "Payroll records"))));
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent(window, new CustomEvent("company-inactive", { detail: "This company is inactive." }));
    expect(screen.queryByText("Payroll records")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("inactive");
    fireEvent.click(screen.getByRole("button", { name: "Reload available data" }));
    expect(screen.getByText("Payroll records")).toBeTruthy();
});

it("refreshes open page data on focus only when active company membership changes", async () => {
    const get = vi.spyOn(api, "get")
        .mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }] })
        .mockResolvedValueOnce({ data: [{ id: 2 }, { id: 1 }] })
        .mockResolvedValueOnce({ data: [{ id: 1 }] });
    render(createElement(MemoryRouter, null,
        createElement(CompanyAccessBoundary, null, createElement("input", { "aria-label": "Draft", defaultValue: "" }))));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "unsaved draft" } });
    fireEvent.focus(window);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("unsaved draft");
    fireEvent.focus(window);
    await waitFor(() => expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(""));
});
