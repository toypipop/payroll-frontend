import { logApiFailure } from "../../../utils/apiDiagnostic";
import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { salaryRows } from "./salaryRows";
import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
export type { SalaryRow } from "./salaryRows";
import type { SalaryPayload } from "./salaryShape";
import type { ApiId } from "../../../types/api";
import type { OptionRow, SalaryHistoryRow } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";

// One page row: the employee, plus the latest salary record resolved out of whatever shape the payload used.
// The three underscored fields are the page's own, added here so the table can sort on them.
// useSalaries owns the page's server data: the employee rows with their latest salary attached, plus the history of one employee.
export const useSalaries = () => {
    const { data, table, refresh: fetchSalaries } = usePagedResource<PageResponse<SalaryPayload>>("/salaries", "id", "asc");
    const salariesData = salaryRows(data?.items ?? []);
    const [historyRows, setHistoryRows] = useState<SalaryHistoryRow[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    // The bulk raise filters by company, so the page needs the same options every employee-linked form uses.
    const [companyOptions, setCompanyOptions] = useState<OptionRow[]>([]);

    useEffect(() => {
        api.get<OptionRow[]>("/companies/options")
            .then((res) => setCompanyOptions(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCompanyOptions([]));
    }, []);

    const fetchHistory = async (empId?: ApiId) => {
        try {
            setHistoryLoading(true);
            const response = await api.get(`/salaries/history/${empId}`);
            setHistoryRows(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            logApiFailure("salary.history", err);
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

    return { salariesData, table, companyOptions, fetchSalaries, historyRows, historyLoading, fetchHistory, clearHistory, deleteHistoryRecord };
};

export default useSalaries;
