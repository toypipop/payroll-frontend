import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useAttendanceConfigs owns the page's server data: one row per company, with its config attached when there is one.
export const useAttendanceConfigs = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const res = await api.get("/attendance/config");
            setConfigs(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    return { configs, loading, fetchConfigs };
};

export default useAttendanceConfigs;
