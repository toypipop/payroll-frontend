import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Bank } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useBanks owns the page's server data: the list it renders, the loading flag, and the calls that change them.
export const useBanks = () => {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/master/banks");
            setBanks(res.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id?: ApiId) => {
        if (!id) return;
        if (!window.confirm("Delete this bank?")) return;
        try {
            await api.delete(`/master/banks/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { banks, loading, fetchData, remove };
};

export default useBanks;
