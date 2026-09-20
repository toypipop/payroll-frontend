import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, WorkLocation } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useWorkLocations = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<WorkLocation>>("/master/work-locations");
    const items = data?.items ?? [];
    const { options: companyOptions } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this work location?")) return;
        try {
            await api.delete(`/master/work-locations/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, table, fetchData, companyOptions, remove };
};

export default useWorkLocations;
