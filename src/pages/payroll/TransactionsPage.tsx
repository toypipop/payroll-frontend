import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import useTransactionsData from "../../hooks/useTransactionsData";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { TONE_TEXT } from "../../components/common/tone";
import SelectField from "../../components/common/SelectField";
import { useAuth } from "../../hooks/useAuth";
import useTransactionSlip from "./transactions/useTransactionSlip";
import TransactionDetailsModal from "./transactions/TransactionDetailsModal";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const StatCard = ({ label, value, tone = 'neutral' }) => (
    <Card className="min-w-[155px] flex-1">
        <div className="text-[10px] font-bold text-subtle uppercase tracking-[0.08em]">{label}</div>
        <div className={`mt-1.5 text-[22px] font-extrabold leading-none tabular-nums ${TONE_TEXT[tone]}`}>{value}</div>
    </Card>
);

const TransactionsPage = () => {
    const { homeCompanyId } = useAuth();
    const [searchParams] = useSearchParams();
    const cycleFromQuery = searchParams.get("cycle_id") || "";

    const {
        cycles,
        selectedCycleId,
        setSelectedCycleId,
        cycleInfo,
        filteredTransactions,
        loadingCycles,
        loadingTransactions,
    } = useTransactionsData(cycleFromQuery);

    const {
        companies, selectedCompanyId, setSelectedCompanyId,
        selectedTransaction, slipData, slipError, loadingDetails, openDetails, closeDetails,
    } = useTransactionSlip(homeCompanyId);

    const filteredCycles = selectedCompanyId
        ? cycles.filter((c) => String(c.companies_id) === String(selectedCompanyId))
        : cycles;

    useEffect(() => {
        if (cycleFromQuery) {
            setSelectedCycleId(String(cycleFromQuery));
        }
    }, [cycleFromQuery, setSelectedCycleId]);

    // Keep the selected cycle in sync with the company filter: the data hook
    useEffect(() => {
        if (cycleFromQuery || !selectedCycleId) return;
        const belongsToCompany = filteredCycles.some((c) => String(c.id) === String(selectedCycleId));
        if (belongsToCompany) return;
        setSelectedCycleId(filteredCycles.length > 0 ? String(filteredCycles[0].id) : "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cycles, selectedCompanyId]);

    const totals = useMemo(() => {
        return filteredTransactions.reduce<{ net: number; earning: number; deduction: number }>(
            (acc, tx) => {
                acc.net += tx.net_pay || 0;
                acc.earning += tx.total_earning || 0;
                acc.deduction += tx.total_deduction || 0;
                return acc;
            },
            { net: 0, earning: 0, deduction: 0 },
        );
    }, [filteredTransactions]);

    const columns = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.toLowerCase(),
            searchableKeys: ["employees.first_name", "employees.last_name", "employees.employees_code"],
            render: (row) => (
                <div>
                    <div className="font-semibold text-main">
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div className="text-[12px] text-subtle mt-[2px]">
                        {row.employees?.employees_code || "-"}
                    </div>
                </div>
            ),
        },
        {
            label: "Companies",
            sortKey: "companies_name",
            sortValue: (row) => row.employees?.companies?.name?.toLowerCase() || "",
            searchableKeys: ["employees.companies.name"],
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Total Earning",
            sortKey: "total_earning",
            sortValue: (row) => row.total_earning || 0,
            render: (row) => (
                <span className="text-success font-mono">
                    ฿{formatCurrency(row.total_earning)}
                </span>
            ),
        },
        {
            label: "Total Deduction",
            sortKey: "total_deduction",
            sortValue: (row) => row.total_deduction || 0,
            render: (row) => (
                <span className="text-danger font-mono">
                    ฿{formatCurrency(row.total_deduction)}
                </span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            sortValue: (row) => row.net_pay || 0,
            render: (row) => (
                <span className="text-main font-bold font-mono">
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
            <PageHeader title="Transactions" />

            <Card className="mb-4">
                <div className="flex gap-[16px] flex-wrap items-end">
                    <SelectField
                        label="Company"
                        options={companies.map((c) => ({ id: c.id, name: c.name }))}
                        value={selectedCompanyId}
                        onChange={(e) => {
                            setSelectedCompanyId(e.target.value);
                            setSelectedCycleId("");
                        }}
                        containerClassName="mb-0 flex-1 min-w-[220px]"
                    />
                    <SelectField
                        label="Closed Payroll Cycle"
                        options={filteredCycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        containerClassName="mb-0 flex-1 min-w-[220px]"
                    />

                    <div className="ml-auto">
                        <Badge status={cycleInfo?.is_closed ? "cancelled" : "pending"}>
                            {cycleInfo?.is_closed ? "Closed / Immutable" : "Awaiting Closed Cycle"}
                        </Badge>
                    </div>
                </div>

                {cycleInfo && (
                    <div className="mt-[12px] text-[13px] text-muted">
                        Period: {formatDate(cycleInfo.start_date)} - {formatDate(cycleInfo.end_date)}
                    </div>
                )}
            </Card>

            {selectedCycleId && (
                <div className="flex gap-[14px] mb-[16px] flex-wrap">
                    <StatCard label="Transactions"   value={filteredTransactions.length} />
                    <StatCard label="Total Earning"  value={`฿${formatCurrency(totals.earning)}`}   tone="success" />
                    <StatCard label="Total Deduction" value={`฿${formatCurrency(totals.deduction)}`} tone="danger" />
                    <StatCard label="Total Net Pay"  value={`฿${formatCurrency(totals.net)}`}        tone="neutral" />
                </div>
            )}

            <Card className="p-0">
                {loadingCycles || loadingTransactions ? (
                    <div className="p-[40px] text-center text-subtle">Loading transactions...</div>
                ) : !selectedCycleId ? (
                    <div className="p-[40px] text-center text-subtle">
                        Select a closed payroll cycle to view immutable transactions.
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-[40px] text-center text-subtle">
                        No transaction records found for this cycle.
                    </div>
                ) : (
                    <Table columns={columns} data={filteredTransactions} onRowClick={openDetails} defaultSort={{ key: "net_pay", order: "desc" }} />
                )}
            </Card>

            <TransactionDetailsModal
                transaction={selectedTransaction}
                slipData={slipData}
                slipError={slipError}
                loading={loadingDetails}
                onClose={closeDetails}
            />
        </>
    );
};

export default TransactionsPage;
