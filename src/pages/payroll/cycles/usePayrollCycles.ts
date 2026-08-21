import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// usePayrollCycles owns the page's server data: the cycles it renders, the company options, and closing a cycle.
export const usePayrollCycles = () => {
    const [cycles, setCycles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCycles = async () => {
        try {
            setLoading(true);
            const res = await api.get("/payroll/cycles");
            setCycles(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await api.get("/companies/options");
            setCompanies(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCycles();
        fetchCompanies();
    }, []);

    const closeCycle = async (id, name) => {
        if (!window.confirm(`Close cycle "${name}"? This will lock all payroll data for this period.`)) return;
        try {
            await api.patch(`/payroll/cycles/${id}/close`);
            fetchCycles();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to close cycle");
        }
    };

    return { cycles, companies, loading, fetchCycles, closeCycle };
};

export default usePayrollCycles;
