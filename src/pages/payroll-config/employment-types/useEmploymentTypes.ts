import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useEmploymentTypes owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useEmploymentTypes = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, companiesRes] = await Promise.all([
                api.get("/master/employment-types"),
                api.get("/companies/options"),
            ]);
            setItems(typesRes.data || []);
            setCompanies(companiesRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this employment type?")) return;
        try {
            await api.delete(`/master/employment-types/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, companies, loading, fetchData, remove };
};

export default useEmploymentTypes;
