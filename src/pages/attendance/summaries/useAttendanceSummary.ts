import { useCallback, useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { monthToDate, toDateStr } from "./dateRange";
import type { SummaryResponse } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";

// useAttendanceSummary drives both summary pages: same date range, same shape of response, different endpoint.
// The row type is the caller's, since the two endpoints differ only in what each row carries.
export const useAttendanceSummary = <T,>(endpoint: string, errorMessage: string) => {
    const initial = monthToDate();
    const [summary, setSummary] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(initial.from);
    const [toDate, setToDate] = useState(initial.to);
    const [meta, setMeta] = useState({ from: "", to: "" });

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get<SummaryResponse<T>>(endpoint, {
                params: { from: toDateStr(fromDate), to: toDateStr(toDate) },
            });
            setSummary(res.data.summary || []);
            setMeta({ from: res.data.from, to: res.data.to });
        } catch (err) {
            console.error("Fetch Error:", err);
            alert(apiErrorMessage(err, errorMessage));
        } finally {
            setLoading(false);
        }
    }, [endpoint, errorMessage, fromDate, toDate]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    return { summary, loading, fromDate, setFromDate, toDate, setToDate, meta, fetchSummary };
};

export default useAttendanceSummary;
