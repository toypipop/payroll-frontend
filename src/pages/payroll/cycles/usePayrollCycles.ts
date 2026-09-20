import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import type { PayrollCycle } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const usePayrollCycles = () => {
    const { data, table, refresh: fetchCycles } = usePagedResource<PageResponse<PayrollCycle>>("/payroll/cycles", "created_at", "desc");
    const cycles = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");

    const closeCycle = async (id?: ApiId, name?: string) => {
        if (!window.confirm(`Close cycle "${name}"? This will lock all payroll data for this period.`)) return;
        try {
            await api.patch(`/payroll/cycles/${id}/close`);
            fetchCycles();
        } catch (err) {
            alert(apiErrorMessage(err, "Failed to close cycle"));
        }
    };

    return { cycles, table, fetchCycles, companies, closeCycle };
};

export default usePayrollCycles;
