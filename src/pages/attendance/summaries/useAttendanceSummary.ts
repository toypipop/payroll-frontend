import { useCallback, useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { monthToDate, toDateStr } from "./dateRange";

// useAttendanceSummary drives both summary pages: same date range, same shape of response, different endpoint.
export const useAttendanceSummary = (endpoint, errorMessage) => {
    const initial = monthToDate();
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(initial.from);
    const [toDate, setToDate] = useState(initial.to);
    const [meta, setMeta] = useState({ from: "", to: "" });

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(endpoint, {
                params: { from: toDateStr(fromDate), to: toDateStr(toDate) },
            });
            setSummary(res.data.summary || []);
            setMeta({ from: res.data.from, to: res.data.to });
        } catch (err) {
            console.error("Fetch Error:", err);
            alert(err.response?.data?.error || errorMessage);
        } finally {
            setLoading(false);
        }
    }, [endpoint, errorMessage, fromDate, toDate]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    return { summary, loading, fromDate, setFromDate, toDate, setToDate, meta, fetchSummary };
};

export default useAttendanceSummary;
