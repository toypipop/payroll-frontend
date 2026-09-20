import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { PayrollCycle } from "../../../types/api";

// useClosedCycleReport is the shape every report page shares: list the closed cycles, select the newest, then load that cycle's report.
// The report body is the caller's type, since each report reads a different payload from its own endpoint.
export const useClosedCycleReport = <T,>(endpointFor: (cycleId: string) => string) => {
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [data, setData] = useState<T | null>(null);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoadingCycles(true);
                const res = await api.get("/payroll/cycles/options");
                const closed = ((res.data || []) as PayrollCycle[]).filter((c) => c.is_closed);
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
                const res = await api.get<T>(endpointFor(selectedCycleId));
                setData(res.data);
            } catch { setData(null); } finally { setLoadingData(false); }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCycleId]);

    return { cycles, selectedCycleId, setSelectedCycleId, data, loadingCycles, loadingData };
};

export default useClosedCycleReport;
