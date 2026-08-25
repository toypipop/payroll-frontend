import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, Department, DepartmentCategory } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useDepartments owns the page's server data: the three lists it renders, the loading flag, and the two calls that change them.
export const useDepartments = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [categories, setCategories] = useState<DepartmentCategory[]>([]);
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

    const remove = async (id?: ApiId) => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        try {
            await api.delete(`/departments/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { departments, companies, categories, setCategories, loading, fetchData, remove };
};

export default useDepartments;
