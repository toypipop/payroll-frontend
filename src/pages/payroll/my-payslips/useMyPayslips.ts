import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useMyPayslips owns the caller's own closed payslips. This route has no permission gate: everyone can read their own.
export const useMyPayslips = () => {
    const [slips, setSlips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/payroll/my-slips")
            .then((res) => setSlips(res.data || []))
            .catch(() => setSlips([]))
            .finally(() => setLoading(false));
    }, []);

    return { slips, loading };
};

export default useMyPayslips;
