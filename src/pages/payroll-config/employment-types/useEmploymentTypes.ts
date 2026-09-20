import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, EmploymentType } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useEmploymentTypes = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<EmploymentType>>("/master/employment-types");
    const items = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this employment type?")) return;
        try {
            await api.delete(`/master/employment-types/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, table, fetchData, companies, remove };
};

export default useEmploymentTypes;
