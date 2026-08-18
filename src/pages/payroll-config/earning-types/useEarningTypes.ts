import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useEarningTypes owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useEarningTypes = () => {
    const [earnings, setEarnings] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEarnings = async () => {
        const res = await api.get("/earning-types");
        setEarnings(res.data);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [earningsRes, companiesRes] = await Promise.all([
                api.get("/earning-types"),
                api.get("/companies/options"),
            ]);
            setEarnings(earningsRes.data);
            setCompanies(companiesRes.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const remove = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/earning-types/${id}`);
            await fetchEarnings();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    return { earnings, companies, loading, fetchEarnings, remove };
};

export default useEarningTypes;
