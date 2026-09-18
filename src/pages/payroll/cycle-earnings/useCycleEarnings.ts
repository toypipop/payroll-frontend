import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, CycleEarning, EarningType } from "../../../types/domain";
import type { ApiId, PayrollCycle } from "../../../types/api";

// useCycleEarnings owns the page's server data: the master lists, plus the rows of whichever cycle is selected.
export const useCycleEarnings = (selectedCycleId?: ApiId) => {
    const [items, setItems] = useState<CycleEarning[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    // Only variable (non-permanent) earning types
    const [earningTypes, setEarningTypes] = useState<EarningType[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch master data once
    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const [companyRes, cycleRes, etRes] = await Promise.all([
                    api.get("/companies/options"),
                    api.get("/payroll/cycles/options"),
                    api.get("/earning-types/options").catch(() => ({ data: [] })),
                ]);
                setCompanies(companyRes.data);
                setCycles(cycleRes.data);
                setEarningTypes(etRes.data);
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMaster();
    }, []);

    // Fetch cycle earnings when selected cycle changes
    useEffect(() => {
        if (!selectedCycleId) {
            setItems([]);
            return;
        }
        const fetchItems = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/cycle-earnings?cycle_id=${selectedCycleId}`);
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
        const res = await api.get(`/cycle-earnings?cycle_id=${selectedCycleId}`);
        setItems(res.data);
    };

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this variable earning?")) return;
        try {
            await api.delete(`/cycle-earnings/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, cycles, earningTypes, loading, refreshItems, remove };
};

export default useCycleEarnings;
