import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useWorkLocations owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useWorkLocations = () => {
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [res, companiesRes] = await Promise.all([
                api.get("/master/work-locations"),
                api.get("/companies/options"),
            ]);
            setItems(res.data || []);
            setCompanyOptions((companiesRes.data || []).map((c) => ({ id: c.id, name: c.name })));
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id) => {
        if (!window.confirm("Delete this work location?")) return;
        try {
            await api.delete(`/master/work-locations/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    return { items, companyOptions, loading, fetchData, remove };
};

export default useWorkLocations;
