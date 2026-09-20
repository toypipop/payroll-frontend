import { usePagedResource } from "../../../hooks/usePagedResource";
import api from "../../../api/axiosInstance";
import type { LeaveRequest } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId, PageResponse } from "../../../types/api";

// useLeaveApprovals owns the pending queue and approval decisions. The server remains authoritative for annual quota checks.
export const useLeaveApprovals = (approverId?: ApiId) => {
    const { data, table, refresh: fetchPending } = usePagedResource<PageResponse<LeaveRequest>>("/leaves/approved");
    const pendingRequests = data?.items ?? [];

    const decide = async (row: LeaveRequest, newStatus: string) => {
        if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this request?`)) return;

        try {
            await api.put(`/leaves/approve/${row.id}`, {
                status: newStatus,
                approved_by: approverId,
            });
            fetchPending();
        } catch (err) {
            alert(apiErrorMessage(err, "Action failed"));
        }
    };

    return { pendingRequests, table, fetchPending, decide };
};

export default useLeaveApprovals;
