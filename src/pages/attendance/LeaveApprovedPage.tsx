import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import useLeaveApprovals from "./leave-approvals/useLeaveApprovals";
import type { TableColumn } from "../../types/api";
import type { LeaveRequest } from "../../types/domain";

const quotaWarningTitle = (row: LeaveRequest) => {
    const affectedYears = row.quota_years?.filter((quota) => quota.exceeded) ?? [];
    if (affectedYears.length > 0) {
        return affectedYears
            .map((quota) => `${quota.year}: ${quota.used_days} used + ${quota.requested_days} requested / ${quota.max_days} days`)
            .join("; ");
    }
    return `Used ${row.quota_used_days} of ${row.quota_max_days} days this year`;
};

const LeaveApprovedPage = () => {
    const { user } = useAuth();
    const { pendingRequests, loading, decide } = useLeaveApprovals(user?.id);

    const columns: TableColumn<LeaveRequest>[] = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
            searchValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""} ${row.employees?.employees_code || ""}`.trim(),
            render: (row) => (
                <div className="whitespace-nowrap">
                    <span className="font-semibold">
                        {row.employees?.first_name} {row.employees?.last_name}
                    </span>
                    <span className="text-[11px] text-muted ml-[8px]">
                        ({row.employees?.employees_code})
                    </span>
                </div>
            )
        },
        {
            label: "Type",
            sortKey: "leave_type",
            sortValue: (row) => (row.leave_type || "").toLowerCase(),
            key: "leave_type",
        },
        {
            label: "Period",
            sortKey: "start_date",
            sortValue: (row) => (row.start_date ? new Date(row.start_date).getTime() : 0),
            render: (row) => {
                const formatDT = (d?: string) => {
                    if (!d) return "—";
                    return new Date(d).toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });
                };
                return (
                    <div className="whitespace-nowrap text-[12px]">
                        {formatDT(row.start_date)} - {formatDT(row.end_date)}
                    </div>
                );
            }
        },
        {
            label: "Days",
            sortKey: "total_days",
            sortValue: (row) => Number(row.total_days) || 0,
            render: (row) => (
                <div className="whitespace-nowrap">
                    {row.total_days}
                    {row.quota_exceeded && (
                        <span
                            className="ml-1.5 text-[11px] font-semibold text-danger-text"
                            title={quotaWarningTitle(row)}
                        >
                            ⚠ Over quota
                        </span>
                    )}
                </div>
            ),
        },
        {
            label: "Reason",
            sortKey: "reason",
            sortValue: (row) => (row.reason || "").toLowerCase(),
            render: (row) => (
                <div className="max-w-[200px] overflow-hidden truncate whitespace-nowrap" title={row.reason}>
                    {row.reason || "-"}
                </div>
            )
        },
        {
            label: "Companies",
            sortKey: "employees.companies.name",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Decision",
            sortable: false,
            render: (row) => (
                <div className="flex gap-[4px] whitespace-nowrap">
                    <Button
                        onClick={() => decide(row, "Approved")}
                        className={`${actionBtn} bg-success text-white`}
                        disabled={row.quota_exceeded}
                        title={row.quota_exceeded ? "This request exceeds the leave type's annual limit" : undefined}
                    >
                        Approve
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => decide(row, "Rejected")}
                        className={actionBtn}
                    >
                        Reject
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Leave Approval Center" />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">Loading pending requests...</div>
                ) : (
                    <Table
                        columns={columns}
                        data={pendingRequests}
                        emptyMessage="No pending leave requests found."
                    />
                )}
            </Card>
        </>
    );
};

const actionBtn = "px-3 py-1.5 text-xs w-auto min-w-[80px]";

export default LeaveApprovedPage;
