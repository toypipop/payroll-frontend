import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../src/App";
import api from "../../src/api/axiosInstance";

vi.mock("../../src/api/axiosInstance", () => ({ default: { get: vi.fn() } }));
vi.mock("../../src/hooks/useModules", () => ({ useModules: () => ({ modules: [], loading: false }) }));
vi.mock("../../src/contexts/ModuleContext", () => ({ ModuleProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("../../src/contexts/NotificationProvider", () => ({ NotificationProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("../../src/components/layouts/MainLayout", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("../../src/pages/dashboard/DashboardPage", () => ({ default: () => <div>Dashboard content</div> }));
vi.mock("../../src/pages/payroll/MyPayslipsPage", () => ({ default: () => <div>Payslips content</div> }));
vi.mock("../../src/pages/auth/LoginPage", () => ({ default: () => <div>Login form</div> }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("universal routes after session verification", () => {
    it.each([
        ["/dashboard", "Dashboard content"],
        ["/my-payslips", "Payslips content"],
    ])("opens %s even when modules/mine has no pages", async (path, content) => {
        window.history.replaceState({}, "", path);
        vi.mocked(api.get).mockResolvedValue({ data: { id: 1, full_name: "Test", roles: [], companies_id: 1 } });
        render(<App />);
        expect(await screen.findByText(content)).toBeTruthy();
        expect(window.location.pathname).toBe(path);
    });

    it("still redirects an unauthenticated visitor to login", async () => {
        window.history.replaceState({}, "", "/dashboard");
        vi.mocked(api.get).mockRejectedValue(new Error("Unauthorized"));
        render(<App />);
        expect(await screen.findByText("Login form")).toBeTruthy();
        expect(window.location.pathname).toBe("/login");
    });
});
