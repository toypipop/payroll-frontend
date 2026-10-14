import { logApiFailure } from "../../../utils/apiDiagnostic";
import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { usePagedResource } from "../../../hooks/usePagedResource";
import type { Company, CycleEarning, EarningType } from "../../../types/domain";
import type { ApiId, PayrollCycle, PageResponse } from "../../../types/api";

// useCycleEarnings owns the page's server data: the master lists, plus the rows of whichever cycle is selected.
export const useCycleEarnings = (selectedCycleId?: ApiId) => {
    const endpoint = selectedCycleId ? `/cycle-earnings?cycle_id=${encodeURIComponent(String(selectedCycleId))}` : null;
    const { data, table, refresh: refreshItems } = usePagedResource<PageResponse<CycleEarning>>(endpoint, "amount", "desc");
    const items = data?.items ?? [];
    const [companies, setCompanies] = useState<Company[]>([]);
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    // Only variable (non-permanent) earning types
    const [earningTypes, setEarningTypes] = useState<EarningType[]>([]);

    // Fetch master data once
    useEffect(() => {
        const controller = new AbortController();
        const fetchMaster = async () => {
            try {
                const [companyRes, cycleRes, etRes] = await Promise.all([
                    api.get("/companies/options", { signal: controller.signal }),
                    api.get("/payroll/cycles/options", { signal: controller.signal }),
                    api.get("/earning-types/options", { signal: controller.signal }).catch(() => ({ data: [] })),
                ]);
                if (controller.signal.aborted) return;
                setCompanies(companyRes.data);
                setCycles(cycleRes.data);
                setEarningTypes(etRes.data);
            } catch (err) {
                if (!controller.signal.aborted) logApiFailure("cycle.earnings.options", err);
            }
        };
        void fetchMaster();
        return () => controller.abort();
    }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this variable earning?")) return;
        try {
            await api.delete(`/cycle-earnings/${id}`);
            refreshItems();
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, cycles, earningTypes, table, refreshItems, remove };
};

export default useCycleEarnings;
