import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, EmployeeEarning } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useEarningTypes = () => {
    const { data, table, refresh: fetchEarnings } = usePagedResource<PageResponse<EmployeeEarning>>("/earning-types");
    const earnings = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/earning-types/${id}`);
            await fetchEarnings();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { earnings, table, fetchEarnings, companies, remove };
};

export default useEarningTypes;
