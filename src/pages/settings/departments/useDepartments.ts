import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useDepartments owns the page's server data: the three lists it renders, the loading flag, and the two calls that change them.
export const useDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, compRes, catRes] = await Promise.all([
                api.get("/departments"),
                api.get("/companies/options"),
                api.get("/department-categories"),
            ]);
            setDepartments(deptRes.data || []);
            setCompanies(compRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const remove = async (id) => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        try {
            await api.delete(`/departments/${id}`);
            fetchData();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    return { departments, companies, categories, setCategories, loading, fetchData, remove };
};

export default useDepartments;
