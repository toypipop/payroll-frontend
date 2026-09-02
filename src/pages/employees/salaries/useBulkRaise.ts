import { useState } from "react";
import api from "../../../api/axiosInstance";
import { apiErrorBody, apiErrorMessage } from "../../../utils/apiError";
import type { ApiErrorBody } from "../../../utils/apiError";
import type { BulkRaiseMode, BulkRaisePreview } from "./bulkRaise";

export interface BulkRaiseRequest {
    mode: BulkRaiseMode;
    value: number;
    effective_date: string;
    reason: string;
    targets: { employees_id: number; new_salary: number }[];
}

// useBulkRaise owns the two calls a batch makes and the one piece of state they share: the preview. A refusal
// carries a preview too — the server answers 409 with the same shape — so the screen keeps showing who
// stopped the batch instead of replacing it with an error and losing the detail.
export const useBulkRaise = () => {
    const [preview, setPreview] = useState<BulkRaisePreview | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const clear = () => {
        setPreview(null);
        setError("");
    };

    const runPreview = async (request: BulkRaiseRequest) => {
        setBusy(true);
        setError("");
        try {
            const res = await api.post<BulkRaisePreview>("/salaries/bulk/preview", request);
            setPreview(res.data);
            return res.data;
        } catch (err) {
            setPreview(null);
            setError(apiErrorMessage(err, "Could not work out the raise"));
            return null;
        } finally {
            setBusy(false);
        }
    };

    // apply resolves true only when the whole batch went through.
    const apply = async (request: BulkRaiseRequest): Promise<boolean> => {
        setBusy(true);
        setError("");
        try {
            await api.post("/salaries/bulk", request);
            return true;
        } catch (err) {
            // The refusal names the people who caused it; keeping that preview is more useful than the message.
            const body = apiErrorBody(err) as (ApiErrorBody & { preview?: BulkRaisePreview }) | null;
            if (body?.preview) setPreview(body.preview);
            setError(apiErrorMessage(err, "Could not apply the raise"));
            return false;
        } finally {
            setBusy(false);
        }
    };

    return { preview, busy, error, runPreview, apply, clear };
};
