import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useLeaveTypes owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useLeaveTypes = () => {
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [res, companiesRes] = await Promise.all([
                api.get("/master/leave-types"),
                api.get("/companies/options"),
            ]);
            setItems(res.data || []);
            setCompanyOptions((companiesRes.data || []).map((c: Company) => ({ id: c.id, name: c.name })));
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this leave type?")) return;
        try {
            await api.delete(`/master/leave-types/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, companyOptions, loading, fetchData, remove };
};

export default useLeaveTypes;
