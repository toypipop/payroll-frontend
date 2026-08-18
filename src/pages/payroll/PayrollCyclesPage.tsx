import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import HelpIcon from "../../components/common/HelpIcon";
import { useAuth } from "../../hooks/useAuth";
import usePayrollCycles from "./cycles/usePayrollCycles";
import CycleFormModal from "./cycles/CycleFormModal";

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const PayrollCyclesPage = () => {
    const { homeCompanyId } = useAuth();
    const navigate = useNavigate();
    const { cycles, companies, loading, fetchCycles, closeCycle } = usePayrollCycles();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columns = [
        {
            label: "Cycle Name",
            sortKey: "cycle_name",
            searchableKeys: ["cycle_name"],
            render: (row) => (
                <span style={{ fontWeight: "600", color: "var(--text-strong)" }}>{row.cycle_name}</span>
            ),
        },
        {
            label: "Period",
            sortKey: "start_date",
            sortValue: (row) => new Date(row.start_date).getTime(),
            searchableKeys: ["start_date", "end_date"],
            render: (row) => (
                <span style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                </span>
            ),
        },
        {
            label: "Status",
            sortKey: "is_closed",
            sortValue: (row) => (row.is_closed ? 1 : 0),
            searchValue: (row) => (row.is_closed ? "closed" : "open"),
            render: (row) => (
                <Badge status={row.is_closed ? "rejected" : "active"}>
                    {row.is_closed ? "Closed" : "Open"}
                </Badge>
            ),
        },
        {
            label: "Created",
            sortKey: "created_at",
            sortValue: (row) => new Date(row.created_at).getTime(),
            render: (row) => (
                <span style={{ fontSize: "13px", color: "var(--text-subtle)" }}>{formatDate(row.created_at)}</span>
            ),
        },
        {
            label: "Companies",
            sortKey: "companies.name",
            searchableKeys: ["companies.name"],
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {row.is_closed ? (
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/transactions?cycle_id=${row.id}`)}
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                        >
                            View Transactions
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            onClick={() => closeCycle(row.id, row.cycle_name)}
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                        >
                            Close Cycle
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Payroll Cycles<HelpIcon articleId="payroll-cycles" /></span>}
                actionButton={
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: "auto" }}>
                        + New Cycle
                    </Button>
                }
            />

            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>
                        No payroll cycles yet. Create your first cycle to get started.
                    </div>
                ) : (
                    <Table columns={columns} data={cycles} defaultSort={{ key: "created_at", order: "desc" }} />
                )}
            </Card>

            <CycleFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchCycles}
                homeCompanyId={homeCompanyId}
                companies={companies}
            />
        </>
    );
};

export default PayrollCyclesPage;
