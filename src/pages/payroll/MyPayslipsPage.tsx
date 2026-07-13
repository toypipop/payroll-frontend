import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const MyPayslipsPage = () => {
    const [slips, setSlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get("/payroll/my-slips")
            .then((res) => setSlips(res.data || []))
            .catch(() => setSlips([]))
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        {
            label: "Payroll Cycle",
            sortKey: "cycle_name",
            sortValue: (row) => row.cycle_name?.toLowerCase() || "",
            render: (row) => <span style={{ fontWeight: 600, color: "#0f172a" }}>{row.cycle_name || "-"}</span>,
        },
        {
            label: "Period",
            sortKey: "start_date",
            sortValue: (row) => row.start_date || "",
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                    {formatDate(row.start_date)} – {formatDate(row.end_date)}
                </span>
            ),
        },
        {
            label: "Total Earning",
            sortKey: "total_earning",
            sortValue: (row) => row.total_earning || 0,
            render: (row) => (
                <span style={{ color: "#10b981", fontFamily: "monospace" }}>฿{formatCurrency(row.total_earning)}</span>
            ),
        },
        {
            label: "Total Deduction",
            sortKey: "total_deduction",
            sortValue: (row) => row.total_deduction || 0,
            render: (row) => (
                <span style={{ color: "#ef4444", fontFamily: "monospace" }}>฿{formatCurrency(row.total_deduction)}</span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            sortValue: (row) => row.net_pay || 0,
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                    ฿{formatCurrency(row.net_pay)}
                </span>
            ),
        },
        {
            label: "Status",
            sortable: false,
            render: () => <Badge status="cancelled">Closed / Locked</Badge>,
        },
    ];

    const detailColumns = [
        { label: "Item", key: "item_name" },
        {
            label: "Type",
            sortKey: "type",
            sortValue: (row) => (row.type || "").toLowerCase(),
            render: (row) => <Badge status={row.type === "earning" ? "active" : "rejected"}>{row.type}</Badge>,
        },
        {
            label: "Amount",
            sortKey: "amount",
            sortValue: (row) => Number(row.amount) || 0,
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>฿{formatCurrency(row.amount)}</span>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="My Payslips" />

            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : slips.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        No payslips available yet.
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={slips}
                        onRowClick={(row) => setSelected(row)}
                        defaultSort={{ key: "start_date", order: "desc" }}
                    />
                )}
            </Card>

            <Modal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                title={`Payslip — ${selected?.cycle_name || ""}`}
            >
                {selected && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Period</span>
                            <span style={{ fontWeight: 600 }}>{formatDate(selected.start_date)} – {formatDate(selected.end_date)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Position (at payout)</span>
                            <span style={{ fontWeight: 600 }}>{selected.position_name || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Department (at payout)</span>
                            <span style={{ fontWeight: 600 }}>{selected.department_name || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Paid to Bank Account</span>
                            <span style={{ fontWeight: 600 }}>
                                {selected.bank_name || "-"} {selected.bank_account_no ? `(${selected.bank_account_no})` : ""}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Net Pay</span>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>฿{formatCurrency(selected.net_pay)}</span>
                        </div>
                        <div style={{ margin: "12px 0" }}>
                            <Badge status="cancelled">Read-only audit trail</Badge>
                        </div>
                        <Card style={{ padding: "0px" }}>
                            <Table columns={detailColumns} data={selected.details || []} />
                        </Card>
                    </>
                )}
            </Modal>
        </>
    );
};

export default MyPayslipsPage;
