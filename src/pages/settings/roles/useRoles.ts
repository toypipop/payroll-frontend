import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, Role } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";

export const useRoles = () => {
    const { data, table, refresh: fetchRoles } = usePagedResource<PageResponse<Role>>("/roles");
    const roles = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await api.delete(`/roles/${id}`);
            await fetchRoles();
        } catch {
            alert("Delete failed");
        }
    };

    return { roles, table, fetchRoles, companies, remove };
};

export default useRoles;
