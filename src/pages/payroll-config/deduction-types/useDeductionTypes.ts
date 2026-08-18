import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useDeductionTypes owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useDeductionTypes = () => {
    const [deductions, setDeductions] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDeductions = async () => {
        const res = await api.get("/deduction-types");
        setDeductions(res.data);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [deductionsRes, companiesRes] = await Promise.all([
                api.get("/deduction-types"),
                api.get("/companies/options"),
            ]);
            setDeductions(deductionsRes.data);
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
            await api.delete(`/deduction-types/${id}`);
            await fetchDeductions();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    return { deductions, companies, loading, fetchDeductions, remove };
};

export default useDeductionTypes;
