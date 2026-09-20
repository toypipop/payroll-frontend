import { usePagedResource } from "../../../hooks/usePagedResource";
import type { MySlip, PageResponse } from "../../../types/api";

// Identity comes from the session cookie; this request never accepts an employee ID.
export const useMyPayslips = () => {
    const { data, table } = usePagedResource<PageResponse<MySlip>>("/payroll/my-slips", "start_date", "desc");
    return { slips: data?.items ?? [], table };
};

export default useMyPayslips;
