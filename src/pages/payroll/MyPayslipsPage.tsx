import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import useMyPayslips from "./my-payslips/useMyPayslips";
import PayslipDetailsModal from "./my-payslips/PayslipDetailsModal";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const MyPayslipsPage = () => {
    const { slips, loading } = useMyPayslips();
    const [selected, setSelected] = useState(null);

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

            <PayslipDetailsModal slip={selected} onClose={() => setSelected(null)} />
        </>
    );
};

export default MyPayslipsPage;
