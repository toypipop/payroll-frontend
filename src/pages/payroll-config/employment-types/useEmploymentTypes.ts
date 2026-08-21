import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useEmploymentTypes owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useEmploymentTypes = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
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

    const remove = async (id) => {
        if (!window.confirm("Delete this employment type?")) return;
        try {
            await api.delete(`/master/employment-types/${id}`);
            fetchData();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    return { items, companies, loading, fetchData, remove };
};

export default useEmploymentTypes;
