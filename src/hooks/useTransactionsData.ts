import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import api from "../api/axiosInstance";
import type { PayrollCycle, PayrollTransaction, PayrollTransactionsResponse } from "../types/api";

export interface TransactionsDataState {
    cycles: PayrollCycle[];
    selectedCycleId: string;
    setSelectedCycleId: Dispatch<SetStateAction<string>>;
    cycleInfo: PayrollCycle | null;
    employeeQuery: string;
    setEmployeeQuery: Dispatch<SetStateAction<string>>;
    transactions: PayrollTransaction[];
    filteredTransactions: PayrollTransaction[];
    loadingCycles: boolean;
    loadingTransactions: boolean;
    refreshCycles: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

export default function useTransactionsData(initialCycleId = ""): TransactionsDataState {
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState(initialCycleId);
    const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
    const [cycleInfo, setCycleInfo] = useState<PayrollCycle | null>(null);
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    const fetchCycles = useCallback(async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get<PayrollCycle[]>("/payroll/cycles");
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

    const fetchTransactions = useCallback(async (cycleId: string) => {
        if (!cycleId) {
            setTransactions([]);
            setCycleInfo(null);
            return;
        }

        try {
            setLoadingTransactions(true);
            const res = await api.get<PayrollTransactionsResponse>(`/payroll/transactions/${cycleId}`);
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
