import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance";

export default function useTransactionsData(initialCycleId = "") {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState(initialCycleId);
    const [transactions, setTransactions] = useState([]);
    const [cycleInfo, setCycleInfo] = useState(null);
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    const fetchCycles = useCallback(async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get("/payroll/cycles");
            const all = res.data || [];
            const closed = all.filter((c) => c.is_closed);
            setCycles(closed);

            if (!selectedCycleId && closed.length > 0) {
                setSelectedCycleId(String(closed[0].id));
            }
        } catch (err) {
            console.error("Failed to fetch cycles", err);
            setCycles([]);
        } finally {
            setLoadingCycles(false);
        }
    }, [selectedCycleId]);

    const fetchTransactions = useCallback(async (cycleId) => {
        if (!cycleId) {
            setTransactions([]);
            setCycleInfo(null);
            return;
        }

        try {
            setLoadingTransactions(true);
            const res = await api.get(`/payroll/transactions/${cycleId}`);
            setTransactions(res.data?.transactions || []);
            setCycleInfo(res.data?.cycle || null);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
            setTransactions([]);
            setCycleInfo(null);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    useEffect(() => {
        fetchCycles();
    }, [fetchCycles]);

    useEffect(() => {
        fetchTransactions(selectedCycleId);
    }, [selectedCycleId, fetchTransactions]);

    const filteredTransactions = useMemo(() => {
        if (!employeeQuery.trim()) return transactions;
        const query = employeeQuery.trim().toLowerCase();

        return transactions.filter((row) => {
            const fullName = `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.toLowerCase();
            const code = (row.employees?.employees_code || "").toLowerCase();
            return fullName.includes(query) || code.includes(query);
        });
    }, [transactions, employeeQuery]);

    return {
        cycles,
        selectedCycleId,
        setSelectedCycleId,
        cycleInfo,
        employeeQuery,
        setEmployeeQuery,
        transactions,
        filteredTransactions,
        loadingCycles,
        loadingTransactions,
        refreshCycles: fetchCycles,
        refreshTransactions: () => fetchTransactions(selectedCycleId),
    };
}
