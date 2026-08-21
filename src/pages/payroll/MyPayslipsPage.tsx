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
    return new Date(value).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
};

const MyPayslipsPage = () => {
    const { slips, loading } = useMyPayslips();
    const [selected, setSelected] = useState(null);

    const columns = [
        {
            label: "Payroll Cycle",
            sortKey: "cycle_name",
            sortValue: (row) => row.cycle_name?.toLowerCase() || "",
            render: (row) => <span className="font-semibold text-main">{row.cycle_name || "-"}</span>,
        },
        {
            label: "Period",
            sortKey: "start_date",
            sortValue: (row) => row.start_date || "",
            render: (row) => (
                <span className="text-[13px] text-muted">
                    {formatDate(row.start_date)} – {formatDate(row.end_date)}
                </span>
            ),
        },
        {
            label: "Total Earning",
            sortKey: "total_earning",
            sortValue: (row) => row.total_earning || 0,
            render: (row) => (
                <span className="text-success font-mono">฿{formatCurrency(row.total_earning)}</span>
            ),
        },
        {
            label: "Total Deduction",
            sortKey: "total_deduction",
            sortValue: (row) => row.total_deduction || 0,
            render: (row) => (
                <span className="text-danger font-mono">฿{formatCurrency(row.total_deduction)}</span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            sortValue: (row) => row.net_pay || 0,
            render: (row) => (
                <span className="font-mono font-bold text-main">
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

            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center text-subtle">Loading...</div>
                ) : slips.length === 0 ? (
                    <div className="p-[40px] text-center text-subtle">
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
