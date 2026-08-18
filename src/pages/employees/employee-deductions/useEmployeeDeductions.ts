import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useEmployeeDeductions owns the page's server data: the assignments plus the three option lists the form cascades through.
export const useEmployeeDeductions = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [deductionTypes, setDeductionTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        const res = await api.get("/employee-deductions");
        setItems(res.data);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, empRes, etRes, companyRes] = await Promise.all([
                api.get("/employee-deductions"),
                api.get("/employees"),
                api.get("/deduction-types/options").catch(() => ({ data: [] })),
                api.get("/companies/options"),
            ]);
            setItems(itemsRes.data);
            setEmployees(empRes.data);
            setDeductionTypes(etRes.data);
            setCompanies(companyRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id) => {
        if (!window.confirm("Delete this assignment?")) return;
        try {
            await api.delete(`/employee-deductions/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, employees, deductionTypes, loading, fetchItems, remove };
};

export default useEmployeeDeductions;
