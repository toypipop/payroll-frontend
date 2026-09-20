import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import type { Company } from "../../../types/domain";

export const usePayrollConfigs = () => {
    const { data, table, refresh: fetchConfigs } = usePagedResource<PageResponse<Company>>("/global");
    const configs = data?.items ?? [];

    return { configs, table, fetchConfigs };
};

export default usePayrollConfigs;
