import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, EmployeeEarning } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useEarningTypes owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useEarningTypes = () => {
    const [earnings, setEarnings] = useState<EmployeeEarning[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
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

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/earning-types/${id}`);
            await fetchEarnings();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { earnings, companies, loading, fetchEarnings, remove };
};

export default useEarningTypes;
