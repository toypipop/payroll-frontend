import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import type { Bank } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useBanks = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<Bank>>("/master/banks");
    const banks = data?.items ?? [];

    const remove = async (id?: ApiId) => {
        if (!id) return;
        if (!window.confirm("Delete this bank?")) return;
        try {
            await api.delete(`/master/banks/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { banks, table, fetchData, remove };
};

export default useBanks;
