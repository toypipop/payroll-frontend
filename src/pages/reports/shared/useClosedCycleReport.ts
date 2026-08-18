import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useClosedCycleReport is the shape every report page shares: list the closed cycles, select the newest, then load that cycle's report.
export const useClosedCycleReport = (endpointFor) => {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [data, setData] = useState(null);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoadingCycles(true);
                const res = await api.get("/payroll/cycles");
                const closed = (res.data || []).filter((c) => c.is_closed);
                setCycles(closed);
                if (closed.length > 0) setSelectedCycleId(String(closed[0].id));
            } catch { /* silent */ } finally { setLoadingCycles(false); }
        })();
    }, []);

    useEffect(() => {
        if (!selectedCycleId) return;
        (async () => {
            try {
                setLoadingData(true);
                setData(null);
                const res = await api.get(endpointFor(selectedCycleId));
                setData(res.data);
            } catch { setData(null); } finally { setLoadingData(false); }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCycleId]);

    return { cycles, selectedCycleId, setSelectedCycleId, data, loadingCycles, loadingData };
};

export default useClosedCycleReport;
