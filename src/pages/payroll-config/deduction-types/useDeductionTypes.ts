import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, EmployeeDeduction } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useDeductionTypes = () => {
    const { data, table, refresh: fetchDeductions } = usePagedResource<PageResponse<EmployeeDeduction>>("/deduction-types");
    const deductions = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/deduction-types/${id}`);
            await fetchDeductions();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { deductions, table, fetchDeductions, companies, remove };
};

export default useDeductionTypes;
