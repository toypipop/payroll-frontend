import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, Position } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const usePositions = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<Position>>("/positions");
    const positions = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this position?")) return;
        try {
            await api.delete(`/positions/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { positions, table, fetchData, companies, remove };
};

export default usePositions;
