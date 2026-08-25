import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, Position } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// usePositions owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const usePositions = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [posRes, compRes] = await Promise.all([
                api.get("/positions"),
                api.get("/companies/options"),
            ]);
            setPositions(posRes.data || []);
            setCompanies(compRes.data || []);
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
        if (!window.confirm("Are you sure you want to delete this position?")) return;
        try {
            await api.delete(`/positions/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { positions, companies, loading, fetchData, remove };
};

export default usePositions;
