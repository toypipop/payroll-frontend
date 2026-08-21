import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useCompanies owns the page's server data: the list it renders, the loading flag, and the calls that change them.
export const useCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await api.get("/companies/all");
            setCompanies(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const remove = async (id) => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this companies?")) return;
        try {
            await api.delete(`/companies/${id}`);
            fetchCompanies();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    return { companies, loading, fetchCompanies, remove };
};

export default useCompanies;
