import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, LeaveTypeSetting } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useLeaveTypes = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<LeaveTypeSetting>>("/master/leave-types");
    const items = data?.items ?? [];
    const { options: companyOptions } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this leave type?")) return;
        try {
            await api.delete(`/master/leave-types/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, table, fetchData, companyOptions, remove };
};

export default useLeaveTypes;
