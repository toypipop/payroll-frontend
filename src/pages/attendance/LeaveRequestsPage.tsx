import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import HelpIcon from "../../components/common/HelpIcon";
import { useAuth } from "../../hooks/useAuth";
import useLeaveRequests from "./leave-requests/useLeaveRequests";
import LeaveRequestFormModal from "./leave-requests/LeaveRequestFormModal";

const LeaveRequestsPage = () => {
    const { homeCompanyId } = useAuth();
    const { requests, loading, fetchRequests, remove, masterCompanies, masterEmployees, masterLeaveTypes, employeeData } = useLeaveRequests();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    // Only a pending request can still be changed, which is why Edit refuses anything else.
    const openEdit = (req) => {
        if (req.status !== "Pending") {
            alert("Only pending requests can be edited");
            return;
        }
        setEditing(req);
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
            searchValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""} ${row.employees?.employees_code || ""}`.trim(),
            render: (row) => (
                <div className="whitespace-nowrap">
                    <div className="font-semibold">
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div className="text-[11px] text-muted">
                        {row.employees?.employees_code}
                    </div>
                </div>
            )
        },
        {
            label: "Type",
            sortKey: "leave_type_name",
            sortValue: (row) => (row.leave_type_master?.name || row.leave_type || "").toLowerCase(),
            searchValue: (row) => row.leave_type_master?.name || row.leave_type || "",
            render: (row) => row.leave_type_master?.name || row.leave_type || "—",
        },
        {
            label: "Duration",
            sortKey: "start_date",
            sortValue: (row) => (row.start_date ? new Date(row.start_date).getTime() : 0),
            render: (row) => {
                const formatD = (d) => new Date(d).toLocaleDateString('en-GB', { timeZone: "Asia/Bangkok",
                    day: '2-digit', month: '2-digit', year: '2-digit'
                });
                return <div className="whitespace-nowrap">{formatD(row.start_date)} - {formatD(row.end_date)}</div>;
            }
        },
        {
            label: "Status",
            sortKey: "status",
            render: (row) => <Badge status={row.status}>{row.status}</Badge>,
        },
        {
            label: "Approved By",
            sortKey: "approver_name",
            sortValue: (row) => `${row.approver?.first_name || ""} ${row.approver?.last_name || ""}`.trim().toLowerCase(),
            searchValue: (row) => `${row.approver?.first_name || ""} ${row.approver?.last_name || ""}`.trim(),
            render: (row) => (
                <div className="text-[13px] text-body">
                    {row.approver ? (
                        <div className="whitespace-nowrap">
                            {row.approver.first_name} {row.approver.last_name}
                        </div>
                    ) : (
                        <span className="text-subtle italic">-</span>
                    )}
                </div>
            ),
        },
        {
            label: "Companies",
            sortKey: "employees.companies.name",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div className="flex gap-[8px]">
                    <Button
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        className={`${smallBtn} ${row.status === "Pending" ? "opacity-100 cursor-pointer" : "opacity-45 cursor-not-allowed"}`}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => remove(row.id || row.ID)}
                        className={smallBtn}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={<span className="flex items-center gap-[8px]">Leave Requests<HelpIcon articleId="leave-requests" /></span>}
                actionButton={
                    <Button onClick={openAdd}>
                        + Create Request
                    </Button>
                }
            />
            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">Loading...</div>
                ) : (
                    <Table columns={columns} data={requests} />
                )}
            </Card>

            <LeaveRequestFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchRequests}
                editing={editing}
                homeCompanyId={homeCompanyId}
                masterCompanies={masterCompanies}
                masterEmployees={masterEmployees}
                masterLeaveTypes={masterLeaveTypes}
                employeeData={employeeData}
            />
        </>
    );
};

const smallBtn = "px-3 py-1.5 text-xs";

export default LeaveRequestsPage;
