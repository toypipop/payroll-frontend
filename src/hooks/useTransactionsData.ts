import { useCallback, useEffect, useState } from "react";
import api from "../api/axiosInstance";
import type { PayrollCycle, PayrollTransactionsResponse } from "../types/api";
import { usePagedResource } from "./usePagedResource";

export default function useTransactionsData(initialCycleId = "") {
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState(initialCycleId);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const { data, table, refresh } = usePagedResource<PayrollTransactionsResponse>(
        selectedCycleId ? `/payroll/transactions/${selectedCycleId}` : null, "net_pay", "desc",
    );
    const fetchCycles = useCallback(async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get<PayrollCycle[]>("/payroll/cycles");
            const closed = res.data.filter((cycle) => cycle.is_closed);
            setCycles(closed);
            setSelectedCycleId((current) => current || String(closed[0]?.id ?? ""));
        } catch { setCycles([]); }
        finally { setLoadingCycles(false); }
    }, []);
    useEffect(() => { void fetchCycles(); }, [fetchCycles]);
    return {
        cycles, selectedCycleId, setSelectedCycleId,
        cycleInfo: data?.cycle ?? null,
        filteredTransactions: data?.transactions ?? [],
        summary: data?.summary,
        table, loadingCycles,
        loadingTransactions: table.loading,
        refreshCycles: fetchCycles, refreshTransactions: refresh,
    };
}
