import { useCallback, useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";

// useCompanies owns the page's server data: the list it renders, the loading flag, and the calls that change them.
export const useCompanies = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCompanies = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get<Company[]>("/companies/all");
            setCompanies(response.data);
        } catch (err) {
            setCompanies([]);
            setError(apiErrorMessage(err, "Unable to load companies."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
        window.addEventListener("focus", fetchCompanies);
        return () => window.removeEventListener("focus", fetchCompanies);
    }, [fetchCompanies]);

    return { companies, loading, error, fetchCompanies };
};

export default useCompanies;
