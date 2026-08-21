import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// usePayrollConfigs owns the page's server data: one row per company, with its payroll config attached when there is one.
export const usePayrollConfigs = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/global");
            setConfigs(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    return { configs, loading, fetchConfigs };
};

export default usePayrollConfigs;
