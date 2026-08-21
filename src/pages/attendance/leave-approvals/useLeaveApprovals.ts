import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useLeaveApprovals owns the pending queue and the approve/reject call, including the quota warning that call has to confirm first.
export const useLeaveApprovals = (approverId) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const response = await api.get("/leaves/approved");
            setPendingRequests(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const decide = async (row, newStatus) => {
        let confirmMsg = `Are you sure you want to ${newStatus.toLowerCase()} this request?`;
        if (newStatus === "Approved" && row.quota_exceeded) {
            confirmMsg = `⚠ This employee will exceed the yearly quota for ${row.leave_type} `
                + `(used ${row.quota_used_days} of ${row.quota_max_days} days, requesting ${row.total_days} more).\n\n`
                + `Approve anyway?`;
        }
        if (!window.confirm(confirmMsg)) return;

        try {
            await api.put(`/leaves/approve/${row.id}`, {
                status: newStatus,
                approved_by: approverId,
            });
            fetchPending();
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        }
    };

    return { pendingRequests, loading, fetchPending, decide };
};

export default useLeaveApprovals;
