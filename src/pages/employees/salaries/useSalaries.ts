import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { getLatestSalaryStructure, getSalaryRecordId } from "./salaryShape";

// useSalaries owns the page's server data: the employee rows with their latest salary attached, plus the history of one employee.
export const useSalaries = () => {
    const [salariesData, setSalariesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get("/salaries");
            const rows = Array.isArray(response.data) ? response.data : [];
            const normalized = rows
                .map((row) => {
                    const latest = getLatestSalaryStructure(row);
                    const updatedAt = latest?.updated_at || latest?.created_at || null;
                    const latestId = getSalaryRecordId(latest, row);
                    const recentSort = updatedAt ? new Date(updatedAt).getTime() : latestId;
                    return {
                        ...row,
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

    const fetchHistory = async (empId) => {
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

    const deleteHistoryRecord = async (recordId, empId) => {
        if (!window.confirm("Delete this salary record permanently? This cannot be undone.")) return;
        try {
            await api.delete(`/salaries/${recordId}`);
            if (empId) fetchHistory(empId);
            fetchSalaries();
        } catch (err) {
            alert(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Delete failed"
            );
        }
    };

    return { salariesData, loading, fetchSalaries, historyRows, historyLoading, fetchHistory, clearHistory, deleteHistoryRecord };
};

export default useSalaries;
