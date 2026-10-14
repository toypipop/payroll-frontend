import { describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { apiDiagnostic, logApiFailure } from "./apiDiagnostic";

describe("safe API diagnostics", () => {
    it("retains only status, known transport code and a server request ID", () => {
        const requestID = "a".repeat(32);
        const config = { headers: new AxiosHeaders({ Cookie: "cookie-secret" }), data: { password: "password-secret" } };
        const error = new AxiosError("private-message", "ERR_BAD_REQUEST", config, {}, {
            status: 401, statusText: "private-status", config,
            headers: { "x-request-id": requestID }, data: { bank_number: "bank-secret" },
        });
        expect(apiDiagnostic(error)).toEqual({ status: 401, code: "ERR_BAD_REQUEST", requestID });
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
            logApiFailure("login", error);
            expect(spy).toHaveBeenCalledWith("API request failed", { operation: "login", status: 401, code: "ERR_BAD_REQUEST", requestID });
            expect(JSON.stringify(spy.mock.calls)).not.toMatch(/password-secret|cookie-secret|bank-secret|private-message/);
        } finally { spy.mockRestore(); }
    });

    it("does not log arbitrary error codes, headers or non-Axios errors", () => {
        const error = new AxiosError("secret", "SECRET_MARKER");
        error.response = { status: 999, statusText: "secret", data: "secret", headers: { "x-request-id": "SECRET_MARKER" }, config: { headers: new AxiosHeaders() } };
        expect(apiDiagnostic(error)).toEqual({});
        expect(apiDiagnostic(new Error("secret"))).toEqual({});
    });
});
