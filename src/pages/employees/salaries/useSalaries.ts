import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { getLatestSalaryStructure, getSalaryRecordId } from "./salaryShape";
import type { SalaryPayload } from "./salaryShape";
import type { ApiId } from "../../../types/api";
import type { Employee, SalaryHistoryRow } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";

// One page row: the employee, plus the latest salary record resolved out of whatever shape the payload used.
// The three underscored fields are the page's own, added here so the table can sort on them.
export type SalaryRow = Employee & {
    __salary: SalaryPayload;
    __salary_id: number;
    __recent_sort: number;
};

// useSalaries owns the page's server data: the employee rows with their latest salary attached, plus the history of one employee.
export const useSalaries = () => {
    const [salariesData, setSalariesData] = useState<SalaryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyRows, setHistoryRows] = useState<SalaryHistoryRow[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get("/salaries");
            const rows: SalaryPayload[] = Array.isArray(response.data) ? response.data : [];
            const normalized: SalaryRow[] = rows
                .map((row) => {
                    const latest = getLatestSalaryStructure(row);
                    const latestBag = latest as Record<string, unknown> | null;
                    const updatedAt = (latestBag?.updated_at || latestBag?.created_at || null) as string | null;
                    const latestId = getSalaryRecordId(latest, row);
                    const recentSort = updatedAt ? new Date(updatedAt).getTime() : latestId;
                    return {
                        ...(row as Employee),
                        __salary: latest,
                        __salary_id: latestId,
                        __recent_sort: Number.isNaN(recentSort) ? latestId : recentSort,
                    };
                });
            setSalariesData(normalized);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchHistory = async (empId?: ApiId) => {
        try {
            setHistoryLoading(true);
            const response = await api.get(`/salaries/history/${empId}`);
            setHistoryRows(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Fetch salary history failed:", err);
            setHistoryRows([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const clearHistory = () => setHistoryRows([]);

    // The reason travels in the body: a delete is a salary change like any other, and the trail needs it.
    const deleteHistoryRecord = async (recordId: ApiId | undefined, reason: string, empId?: ApiId) => {
        try {
            await api.delete(`/salaries/${recordId}`, { data: { reason } });
            if (empId) fetchHistory(empId);
            fetchSalaries();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete failed"));
        }
    };

    return { salariesData, loading, fetchSalaries, historyRows, historyLoading, fetchHistory, clearHistory, deleteHistoryRecord };
};

export default useSalaries;
