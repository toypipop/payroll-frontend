import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useEmployeeEarnings owns the page's server data: the assignments plus the three option lists the form cascades through.
export const useEmployeeEarnings = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [earningTypes, setEarningTypes] = useState([]);
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
                api.get("/employees"),
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

    const remove = async (id) => {
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
