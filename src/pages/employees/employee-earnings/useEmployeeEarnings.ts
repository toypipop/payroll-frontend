import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { EmployeeOption } from "../../../types/api";
import type { Company, EarningType, Employee , EmployeeEarning } from "../../../types/domain";
import type { ApiId } from "../../../types/api";

// useEmployeeEarnings owns the page's server data: the assignments plus the three option lists the form cascades through.
export const useEmployeeEarnings = () => {
    const [items, setItems] = useState<EmployeeEarning[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [earningTypes, setEarningTypes] = useState<EarningType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        const res = await api.get("/employee-earnings");
        setItems(res.data);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, empRes, etRes, companyRes] = await Promise.all([
                api.get("/employee-earnings"),
                    api.get<EmployeeOption[]>("/employees/options"),
                api.get("/earning-types/options").catch(() => ({ data: [] })),
                api.get("/companies/options"),
            ]);
            setItems(itemsRes.data);
            setEmployees(empRes.data);
            setEarningTypes(etRes.data);
            setCompanies(companyRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this assignment?")) return;
        try {
            await api.delete(`/employee-earnings/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, employees, earningTypes, loading, fetchItems, remove };
};

export default useEmployeeEarnings;
