import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, CycleDeduction, DeductionType } from "../../../types/domain";
import type { ApiId, PayrollCycle } from "../../../types/api";

// useCycleDeductions owns the page's server data: the master lists, plus the rows of whichever cycle is selected.
export const useCycleDeductions = (selectedCycleId?: ApiId) => {
    const [items, setItems] = useState<CycleDeduction[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    // Only variable (non-permanent) deduction types
    const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch master data once
    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const [companyRes, cycleRes, etRes] = await Promise.all([
                    api.get("/companies/options"),
                    api.get("/payroll/cycles/options"),
                    api.get("/deduction-types/options").catch(() => ({ data: [] })),
                ]);
                setCompanies(companyRes.data);
                setCycles(cycleRes.data);
                setDeductionTypes(etRes.data);
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMaster();
    }, []);

    // Fetch cycle deductions when selected cycle changes
    useEffect(() => {
        if (!selectedCycleId) {
            setItems([]);
            return;
        }
        const fetchItems = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/cycle-deductions?cycle_id=${selectedCycleId}`);
                setItems(res.data);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [selectedCycleId]);

    const refreshItems = async () => {
        if (!selectedCycleId) return;
        const res = await api.get(`/cycle-deductions?cycle_id=${selectedCycleId}`);
        setItems(res.data);
    };

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this variable deduction?")) return;
        try {
            await api.delete(`/cycle-deductions/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, cycles, deductionTypes, loading, refreshItems, remove };
};

export default useCycleDeductions;
