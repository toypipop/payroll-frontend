import { useEffect } from "react";
import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import type { Company } from "../../../types/domain";

export const useCompanies = (status: string) => {
    const endpoint = "/companies/all" + (status === "all" ? "" : `?is_active=${status === "active"}`);
    const { data, table, refresh: fetchCompanies } = usePagedResource<PageResponse<Company>>(endpoint, "id", "desc");
    useEffect(() => {
        window.addEventListener("focus", fetchCompanies);
        return () => window.removeEventListener("focus", fetchCompanies);
    }, [fetchCompanies]);
    return { companies: data?.items ?? [], table, fetchCompanies };
};
export default useCompanies;
