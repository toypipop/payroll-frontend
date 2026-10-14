import { asApiError, apiErrorRequestID, apiErrorStatus } from "./apiError";

const errorCodes = new Set([
    "ERR_NETWORK", "ERR_BAD_REQUEST", "ERR_BAD_RESPONSE", "ERR_CANCELED",
    "ECONNABORTED", "ETIMEDOUT", "ERR_INVALID_URL", "ERR_NOT_SUPPORT",
]);

export type DiagnosticOperation =
    | "login" | "permissions.load" | "payslips.load" | "transaction.slip" | "companies.options"
    | "payroll.cycles" | "payroll.config" | "payroll.run" | "salary.history" | "salary.save"
    | "employees.options" | "employee.earnings.options" | "employee.deductions.options"
    | "cycle.earnings.options" | "cycle.deductions.options"
    | "leave.options" | "timelog.options" | "attendance.summary";

// Do not include URLs, messages, config, bodies, or the original error object.
export function apiDiagnostic(error: unknown): { status?: number; code?: string; requestID?: string } {
    const status = apiErrorStatus(error);
    const code = asApiError(error)?.code;
    const requestID = apiErrorRequestID(error);
    return {
        ...(status !== null && Number.isInteger(status) && status >= 100 && status <= 599 ? { status } : {}),
        ...(code && errorCodes.has(code) ? { code } : {}),
        ...(requestID && /^[a-f0-9]{32}$/.test(requestID) ? { requestID } : {}),
    };
}

export function logApiFailure(operation: DiagnosticOperation, error: unknown): void {
    console.error("API request failed", { operation, ...apiDiagnostic(error) });
}
