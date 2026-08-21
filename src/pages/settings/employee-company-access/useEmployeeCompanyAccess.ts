import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useEmployeeCompanyAccess owns the page's server data: the access rows plus the three option lists the form picks from.
export const useEmployeeCompanyAccess = () => {
    const [accessRows, setAccessRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAccessRows = async () => {
        const res = await api.get("/employee-company-access");
        setAccessRows(res.data || []);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [accessRes, employeesRes, companiesRes, rolesRes] = await Promise.all([
                api.get("/employee-company-access"),
                api.get("/employees"),
                api.get("/companies/options"),
                api.get("/roles/options").catch(() => ({ data: [] })),
            ]);

            setAccessRows(accessRes.data || []);
            setEmployees((employeesRes.data || []).map((employee) => ({
                id: employee.id,
                name: `${employee.employees_code || "EMP"} - ${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
                companies_id: employee.companies_id,
            })));
            setCompanies((companiesRes.data || []).map((company) => ({
                id: company.id,
                name: company.name,
            })));
            setRoles((rolesRes.data || []).map((role) => ({
                id: role.id,
                name: role.name,
                companies_id: role.companies_id,
            })));
        } catch (err) {
            console.error("Employee company access load failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const remove = async (id) => {
        if (!window.confirm("Delete this employee company access?")) return;
        try {
            await api.delete(`/employee-company-access/${id}`);
            await fetchAccessRows();
        } catch (err) {
            alert(err.response?.data?.error || "Delete failed");
        }
    };

    return { accessRows, employees, companies, roles, loading, fetchAccessRows, remove };
};

export default useEmployeeCompanyAccess;
