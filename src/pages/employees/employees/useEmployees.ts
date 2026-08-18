import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useEmployees owns the page's server data: the employee rows plus every master list the form cascades through.
export const useEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [masterDepts, setMasterDepts] = useState([]);
    const [masterPos, setMasterPos] = useState([]);
    const [masterRoles, setMasterRoles] = useState([]);
    const [masterCompanies, setMasterCompanies] = useState([]);
    const [masterBanks, setMasterBanks] = useState([]);
    const [masterEmploymentTypes, setMasterEmploymentTypes] = useState([]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, posRes, rolesRes, empTypesRes, banksRes, compRes] = await Promise.all([
                    api.get("/departments/options").catch(() => ({ data: [] })),
                    api.get("/positions/options").catch(() => ({ data: [] })),
                    api.get("/roles/options").catch(() => ({ data: [] })),
                    api.get("/master/employment-types/options").catch(() => ({ data: [] })),
                    api.get("/master/banks/options").catch(() => ({ data: [] })),
                    api.get("/companies/options").catch(() => ({ data: [] })),
                ]);
                setMasterBanks((banksRes.data || []).map((b) => ({ id: b.id, name: `${b.bank_code} — ${b.bank_name}` })));
                setMasterEmploymentTypes(
                    (empTypesRes.data || []).map((t) => ({
                        id: t.id,
                        name: t.name,
                        companies_id: t.companies_id,
                    })),
                );
                setMasterCompanies((compRes.data || []).map((c) => ({ id: c.id, name: c.name })));

                // Check property names from API match your Backend JSON response (English Comment)
                setMasterDepts(
                    deptRes.data.map((d) => ({
                        id: d.id,
                        name: d.dept_name || d.name,
                        companies_id: d.companies_id,
                    })),
                );
                setMasterPos(
                    posRes.data.map((p) => ({
                        id: p.id,
                        name: p.pos_name || p.name,
                        companies_id: p.companies_id,
                    })),
                );
                setMasterRoles(
                    rolesRes.data.map((r) => ({
                        id: r.id,
                        name: r.roles_name || r.name,
                        companies_id: r.companies_id,
                    })),
                );
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMasterData();
        fetchEmployees();
    }, []);

    const remove = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employees?")) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    return {
        employees, loading, fetchEmployees, remove,
        masterDepts, masterPos, masterRoles, masterCompanies, masterBanks, masterEmploymentTypes,
    };
};

export default useEmployees;
