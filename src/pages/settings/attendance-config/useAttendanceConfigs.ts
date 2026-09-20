import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import type { Company } from "../../../types/domain";

export const useAttendanceConfigs = () => {
    const { data, table, refresh: fetchConfigs } = usePagedResource<PageResponse<Company>>("/attendance/config");
    const configs = data?.items ?? [];

    return { configs, table, fetchConfigs };
};

export default useAttendanceConfigs;
