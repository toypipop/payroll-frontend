import { logApiFailure } from "../../../utils/apiDiagnostic";
import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { usePagedResource } from "../../../hooks/usePagedResource";
import type { Company, CycleDeduction, DeductionType } from "../../../types/domain";
import type { ApiId, PayrollCycle, PageResponse } from "../../../types/api";

// useCycleDeductions owns the page's server data: the master lists, plus the rows of whichever cycle is selected.
export const useCycleDeductions = (selectedCycleId?: ApiId) => {
    const endpoint = selectedCycleId ? `/cycle-deductions?cycle_id=${encodeURIComponent(String(selectedCycleId))}` : null;
    const { data, table, refresh: refreshItems } = usePagedResource<PageResponse<CycleDeduction>>(endpoint, "amount", "desc");
    const items = data?.items ?? [];
    const [companies, setCompanies] = useState<Company[]>([]);
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    // Only variable (non-permanent) deduction types
    const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);

    // Fetch master data once
    useEffect(() => {
        const controller = new AbortController();
        const fetchMaster = async () => {
            try {
                const [companyRes, cycleRes, etRes] = await Promise.all([
                    api.get("/companies/options", { signal: controller.signal }),
                    api.get("/payroll/cycles/options", { signal: controller.signal }),
                    api.get("/deduction-types/options", { signal: controller.signal }).catch(() => ({ data: [] })),
                ]);
                if (controller.signal.aborted) return;
                setCompanies(companyRes.data);
                setCycles(cycleRes.data);
                setDeductionTypes(etRes.data);
            } catch (err) {
                if (!controller.signal.aborted) logApiFailure("cycle.deductions.options", err);
            }
        };
        void fetchMaster();
        return () => controller.abort();
    }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this variable deduction?")) return;
        try {
            await api.delete(`/cycle-deductions/${id}`);
            refreshItems();
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, cycles, deductionTypes, table, refreshItems, remove };
};

export default useCycleDeductions;
