import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useLeaveRequests owns the page's server data: the requests plus the master lists the form cascades through.
export const useLeaveRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [masterCompanies, setMasterCompanies] = useState([]);
    const [masterEmployees, setMasterEmployees] = useState([]);
    const [masterLeaveTypes, setMasterLeaveTypes] = useState([]);
    const [employeeData, setEmployeeData] = useState({});

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/leaves/requests");
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
                setMasterCompanies((companyRes.data || []).map((c) => ({ id: c.id, name: c.name })));
                setMasterEmployees(
                    empRes.data.map((e) => ({
                        id: e.id,
                        name: `${e.employees_code || "-"} - ${e.first_name} ${e.last_name}`,
                        companies_id: e.companies_id,
                    }))
                );

                const empDataMap = {};
                empRes.data.forEach((e) => {
                    empDataMap[e.id] = e;
                });
                setEmployeeData(empDataMap);

                setMasterLeaveTypes((ltRes.data || []).map((lt) => ({
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

    const remove = async (id) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;
        try {
            await api.delete(`/leaves/requests/${id}`);
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    return { requests, loading, fetchRequests, remove, masterCompanies, masterEmployees, masterLeaveTypes, employeeData };
};

export default useLeaveRequests;
