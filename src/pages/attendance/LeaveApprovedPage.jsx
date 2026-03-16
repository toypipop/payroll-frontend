import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";

const LeaveApprovedPage = () => {
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

    const handleAction = async (id, newStatus) => {
        const confirmMsg = `Are you sure you want to ${newStatus.toLowerCase()} this request?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            await api.put(`/leaves/approve/${id}`, {
                status: newStatus,
                approved_by: userData.id || userData.ID
            });
            fetchPending();
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        }
    };

    const columns = [
        {
            label: "Employee",
            render: (row) => (
                <div style={{ whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: "600" }}>
                        {row.employees?.first_name} {row.employees?.last_name}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>
                        ({row.employees?.employees_code})
                    </span>
                </div>
            )
        },
        { label: "Type", key: "leave_type" },
        {
            label: "Period",
            render: (row) => {
                const formatDT = (d) => {
                    const date = new Date(d);
                    return date.toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });
                };
                return (
                    <div style={{ whiteSpace: "nowrap", fontSize: "12px" }}>
                        {formatDT(row.start_date)} - {formatDT(row.end_date)}
                    </div>
                );
            }
        },
        { label: "Days", key: "total_days" },
        {
            label: "Reason",
            render: (row) => (
                <div style={{
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                }} title={row.reason}>
                    {row.reason || "-"}
                </div>
            )
        },
        {
            label: "Companies",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Decision",
            render: (row) => (
                <div style={{ display: "flex", gap: "4px", whiteSpace: "nowrap" }}>
                    <Button
                        onClick={() => handleAction(row.id || row.ID, "Approved")}
                        style={{ ...actionBtn, backgroundColor: "#10b981", color: "#fff" }}
                    >
                        Approve
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleAction(row.id || row.ID, "Rejected")}
                        style={actionBtn}
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
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading pending requests...</div>
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

const actionBtn = {
    padding: "6px 12px",
    fontSize: "12px",
    width: "auto",
    minWidth: "80px"
};

export default LeaveApprovedPage;
