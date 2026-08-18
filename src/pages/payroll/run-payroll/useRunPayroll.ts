import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useRunPayroll owns the whole run: which cycle is selected, its config, the pre-check, the calculation and the diff that follows it.
export const useRunPayroll = (homeCompanyId) => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(homeCompanyId);
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [selectedCycle, setSelectedCycle] = useState(null); // Track cycle object
    const [transactions, setTransactions] = useState([]);
    const [payrollConfig, setPayrollConfig] = useState(null);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [preCheckIssues, setPreCheckIssues] = useState<any[]>([]);
    const [pendingCalculate, setPendingCalculate] = useState(false);
    const [diffData, setDiffData] = useState<any>(null);

    const fetchCycles = async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get("/payroll/cycles");
            const open = (res.data || []).filter((c) => !c.is_closed);
            setCycles(open);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCycles(false);
        }
    };

    const fetchTransactions = async (cycleId) => {
        if (!cycleId) return;
        try {
            setLoadingTx(true);
            const res = await api.get(`/payroll/run/transactions/${cycleId}`);
            // Trigger React re-render via immutability
            setTransactions([...(res.data.transactions || [])]);
        } catch (err) {
            setTransactions([]);
            if (err.response?.status !== 404) console.error(err);
        } finally {
            setLoadingTx(false);
        }
    };

    // Fetch config for selected cycle's company
    const fetchPayrollConfigForCycle = async (cycle) => {
        if (!cycle?.id) {
            console.warn("Cannot fetch config: cycle object missing or invalid", cycle);
            setPayrollConfig(null);
            return;
        }
        try {
            setLoadingConfig(true);
            const res = await api.get(`/payroll/config/${cycle.id}`);
            if (res.data?.config) {
                setPayrollConfig(res.data.config);
            } else {
                console.warn("Config response missing config field:", res.data);
                setPayrollConfig(null);
            }
        } catch (err) {
            console.error("Failed to fetch payroll config:", err.response?.data || err.message);
            setPayrollConfig(null);
        } finally {
            setLoadingConfig(false);
        }
    };

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await api.get("/companies/options");
                setCompanies(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCompanies();
        fetchCycles();
    }, []);

    const filteredCycles = selectedCompanyId
        ? cycles.filter((c) => String(c.companies_id) === String(selectedCompanyId))
        : cycles;

    const changeCompany = (companyId) => {
        setSelectedCompanyId(companyId);
        setSelectedCycleId("");
        setSelectedCycle(null);
        setTransactions([]);
        setPayrollConfig(null);
        setCalcResult(null);
        setDiffData(null);
        setPreCheckIssues([]);
        setPendingCalculate(false);
    };

    // Picking a cycle drops whatever the previous one produced, so nothing stale is shown against the new selection.
    const selectCycle = (cycleId) => {
        setSelectedCycleId(cycleId);
        setPreCheckIssues([]);
        setPendingCalculate(false);
        setDiffData(null);
        const cycle = filteredCycles.find((c) => String(c.id) === String(cycleId));
        if (cycle) setSelectedCycle(cycle);
    };

    const dismissPreCheck = () => {
        setPreCheckIssues([]);
        setPendingCalculate(false);
    };

    // Every listed cycle is open, so there is no audit-locked snapshot to preserve: recalculate on every selection.
    useEffect(() => {
        if (selectedCycleId && cycles.length > 0) {
            const cycle = cycles.find((c) => String(c.id) === String(selectedCycleId));
            if (cycle) {
                setSelectedCycle(cycle);
                fetchPayrollConfigForCycle(cycle);
            }
        }
         
    }, [selectedCycleId, cycles]);

    const runCalculate = async () => {
        if (!selectedCycleId || !selectedCycle) return;
        setPreCheckIssues([]);
        setPendingCalculate(false);
        try {
            setCalculating(true);
            setCalcResult(null);
            setDiffData(null);
            setTransactions([]);
            await fetchPayrollConfigForCycle(selectedCycle);
            const res = await api.post(`/payroll/calculate/${selectedCycleId}`);
            setCalcResult(res.data);
            await fetchTransactions(selectedCycleId);
            const diffRes = await api.get(`/payroll/diff/${selectedCycleId}`);
            setDiffData(diffRes.data);
        } catch (err) {
            alert(err.response?.data?.error || "Calculation failed");
        } finally {
            setCalculating(false);
        }
    };

    const calculate = async () => {
        if (!selectedCycleId || !selectedCycle) return;
        try {
            const res = await api.get(`/payroll/pre-check/${selectedCycleId}`);
            const { ok, issues } = res.data;
            if (ok) {
                runCalculate();
            } else {
                setPreCheckIssues(issues || []);
                setPendingCalculate(true);
            }
        } catch {
            runCalculate();
        }
    };

    // Selecting a cycle immediately recalculates it, which is what the page shows on arrival.
    useEffect(() => {
        if (selectedCycle) {
            calculate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCycle?.id]);

    return {
        companies, cycles: filteredCycles, transactions, payrollConfig,
        selectedCompanyId, selectedCycleId, selectedCycle, selectCycle, changeCompany, dismissPreCheck,
        loadingCycles, loadingTx, loadingConfig, calculating,
        calcResult, diffData, preCheckIssues, pendingCalculate,
        calculate, runCalculate,
    };
};

export default useRunPayroll;
