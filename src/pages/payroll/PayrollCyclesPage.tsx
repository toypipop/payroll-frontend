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
import type { PayrollCycle, TableColumn } from "../../types/api";

const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" }) : "—";

const PayrollCyclesPage = () => {
    const { homeCompanyId } = useAuth();
    const navigate = useNavigate();
    const { cycles, companies, table, fetchCycles, closeCycle } = usePayrollCycles();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columns: TableColumn<PayrollCycle>[] = [
        {
            label: "Cycle Name",
            sortKey: "cycle_name",
            searchableKeys: ["cycle_name"],
            render: (row) => (
                <span className="font-semibold text-strong">{row.cycle_name}</span>
            ),
        },
        {
            label: "Period",
            sortKey: "start_date",
            sortValue: (row) => (row.start_date ? new Date(row.start_date).getTime() : 0),
            searchableKeys: ["start_date", "end_date"],
            render: (row) => (
                <span className="text-[13px] text-body">
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
            sortValue: (row) => (row.created_at ? new Date(String(row.created_at)).getTime() : 0),
            render: (row) => (
                <span className="text-[13px] text-subtle">{formatDate(row.created_at as string | undefined)}</span>
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
                <div className="flex gap-[8px] flex-wrap">
                    {row.is_closed ? (
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/transactions?cycle_id=${row.id}`)}
                            className="text-xs px-3.5 py-1.5"
                        >
                            View Transactions
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            onClick={() => closeCycle(row.id, row.cycle_name)}
                            className="text-xs px-3.5 py-1.5"
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
                title={<span className="flex items-center gap-[8px]">Payroll Cycles<HelpIcon articleId="payroll-cycles" /></span>}
                actionButton={
                    <Button onClick={() => setIsModalOpen(true)} className="w-auto">
                        + New Cycle
                    </Button>
                }
            />

            <Card className="p-0">
                <Table columns={columns} data={cycles} server={table} />
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
