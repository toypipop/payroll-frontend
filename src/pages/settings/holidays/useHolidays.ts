import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, Holiday } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useHolidays = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<Holiday>>("/master/holidays");
    const items = data?.items ?? [];
    const { options: companyOptions } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this holiday?")) return;
        try {
            await api.delete(`/master/holidays/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, table, fetchData, companyOptions, remove };
};

export default useHolidays;
