import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, Employee, LeaveRequest, LeaveTypeSetting, OptionRow } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useLeaveRequests owns the page's server data: the requests plus the master lists the form cascades through.
export const useLeaveRequests = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    // The three master lists are dropdown options this hook builds, not the API's full records.
    const [masterCompanies, setMasterCompanies] = useState<OptionRow[]>([]);
    const [masterEmployees, setMasterEmployees] = useState<OptionRow[]>([]);
    const [masterLeaveTypes, setMasterLeaveTypes] = useState<OptionRow[]>([]);
    const [employeeData, setEmployeeData] = useState<Record<string, Employee>>({});

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get<LeaveRequest[]>("/leaves/requests");
            setRequests(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [empRes, ltRes, companyRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/master/leave-types/options").catch(() => ({ data: [] })),
                    api.get("/companies/options"),
                ]);
                setMasterCompanies((companyRes.data || []).map((c: Company) => ({ id: c.id, name: c.name })));
                setMasterEmployees(
                    (empRes.data as Employee[]).map((e) => ({
                        id: e.id,
                        name: `${e.employees_code || "-"} - ${e.first_name} ${e.last_name}`,
                        companies_id: e.companies_id,
                    }))
                );

                const empDataMap: Record<string, Employee> = {};
                (empRes.data as Employee[]).forEach((e) => {
                    if (e.id != null) empDataMap[String(e.id)] = e;
                });
                setEmployeeData(empDataMap);

                setMasterLeaveTypes((ltRes.data || []).map((lt: LeaveTypeSetting) => ({
                    id: lt.id,
                    name: lt.name,
                    companies_id: lt.companies_id
                })));
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchRequests();
    }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;
        try {
            await api.delete(`/leaves/requests/${id}`);
            fetchRequests();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { requests, loading, fetchRequests, remove, masterCompanies, masterEmployees, masterLeaveTypes, employeeData };
};

export default useLeaveRequests;
