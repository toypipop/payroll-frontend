import { AxiosError } from "axios";

// The error body the API returns on every failure: `{ "error": "..." }`, plus the `reason` a delete guard adds.
export interface ApiErrorBody {
    error?: string;
    reason?: string;
    message?: string;
}

// asApiError narrows a caught value to the Axios error it almost always is.
// A `catch` binding is `unknown` under strict mode, and reading `.response` off it directly is exactly the
// assumption that breaks when the thing thrown is a TypeError from the handler rather than a failed request.
export const asApiError = (err: unknown): AxiosError<ApiErrorBody> | null =>
    err instanceof AxiosError ? (err as AxiosError<ApiErrorBody>) : null;

// apiErrorBody is the parsed `{ error, reason }` the server sent, or null when the failure never reached it.
export const apiErrorBody = (err: unknown): ApiErrorBody | null => asApiError(err)?.response?.data ?? null;

// apiErrorStatus is the HTTP status, or null when the request never got a response.
export const apiErrorStatus = (err: unknown): number | null => asApiError(err)?.response?.status ?? null;

// apiErrorMessage is what to show the user: the server's message when there is one, otherwise the caller's fallback.
// `reason` is appended because the delete guard uses it to name what still references the row.
export const apiErrorMessage = (err: unknown, fallback: string): string => {
    const body = apiErrorBody(err);
    const message = body?.error || body?.message;
    if (message && body?.reason) return `${message}: ${body.reason}`;
    return message || fallback;
};
