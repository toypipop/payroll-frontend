import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../../api/axiosInstance";
import useTransactionsData from "../../hooks/useTransactionsData";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";

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

const TransactionsPage = () => {
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

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [slipData, setSlipData] = useState(null);
    const [slipError, setSlipError] = useState<string | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (cycleFromQuery) {
            setSelectedCycleId(String(cycleFromQuery));
        }
    }, [cycleFromQuery, setSelectedCycleId]);

    const openDetails = async (tx) => {
        setSelectedTransaction(tx);
        setSlipData(null);
        setSlipError(null);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/payroll/slip/${tx.id}`);
            setSlipData(res.data || null);
        } catch (err) {
            const msg = err.response?.data?.error || "Unable to load transaction details.";
            setSlipError(msg);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeDetails = () => {
        setSelectedTransaction(null);
        setSlipData(null);
        setSlipError(null);
    };

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
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
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
                <span style={{ color: "#10b981", fontFamily: "monospace" }}>
                    ฿{formatCurrency(row.total_earning)}
                </span>
            ),
        },
        {
            label: "Total Deduction",
            sortKey: "total_deduction",
            sortValue: (row) => row.total_deduction || 0,
            render: (row) => (
                <span style={{ color: "#ef4444", fontFamily: "monospace" }}>
                    ฿{formatCurrency(row.total_deduction)}
                </span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            sortValue: (row) => row.net_pay || 0,
            render: (row) => (
                <span style={{ color: "#0f172a", fontWeight: 700, fontFamily: "monospace" }}>
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
            searchValue: (row) => (Number(row.amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    ฿{formatCurrency(row.amount)}
                </span>
            ),
        },
    ];

    const StatCard = ({ label, value, color = '#0f172a' }) => (
        <Card style={{ minWidth: '155px', flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ marginTop: '6px', fontSize: '22px', fontWeight: '800', color, fontVariantNumeric: 'tabular-nums', lineHeight: '1' }}>{value}</div>
        </Card>
    );

    return (
        <>
            <PageHeader title="Transactions" />

            <Card style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "end" }}>
                    <SelectField
                        label="Closed Payroll Cycle"
                        options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        containerStyle={{ minWidth: "260px", marginBottom: 0 }}
                    />

                    <div style={{ marginLeft: "auto" }}>
                        <Badge status={cycleInfo?.is_closed ? "cancelled" : "pending"}>
                            {cycleInfo?.is_closed ? "Closed / Immutable" : "Awaiting Closed Cycle"}
                        </Badge>
                    </div>
                </div>

                {cycleInfo && (
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
                        Period: {formatDate(cycleInfo.start_date)} - {formatDate(cycleInfo.end_date)}
                    </div>
                )}
            </Card>

            {selectedCycleId && (
                <div style={{ display: "flex", gap: "14px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <StatCard label="Transactions"   value={filteredTransactions.length} />
                    <StatCard label="Total Earning"  value={`฿${formatCurrency(totals.earning)}`}   color="#10b981" />
                    <StatCard label="Total Deduction" value={`฿${formatCurrency(totals.deduction)}`} color="#ef4444" />
                    <StatCard label="Total Net Pay"  value={`฿${formatCurrency(totals.net)}`}        color="#0f172a" />
                </div>
            )}

            <Card style={{ padding: "0px" }}>
                {loadingCycles || loadingTransactions ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading transactions...</div>
                ) : !selectedCycleId ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Select a closed payroll cycle to view immutable transactions.
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        No transaction records found for this cycle.
                    </div>
                ) : (
                    <Table columns={columns} data={filteredTransactions} onRowClick={openDetails} defaultSort={{ key: "net_pay", order: "desc" }} />
                )}
            </Card>

            <Modal
                isOpen={!!selectedTransaction}
                onClose={closeDetails}
                title={`Transaction Details${selectedTransaction?.employees ? ` - ${selectedTransaction.employees.first_name} ${selectedTransaction.employees.last_name}` : ""}`}
            >
                {loadingDetails ? (
                    <div style={{ padding: "12px 0", color: "#94a3b8" }}>Loading details...</div>
                ) : slipError ? (
                    <div style={{ padding: "12px 0", color: "#ef4444" }}>{slipError}</div>
                ) : !slipData?.slip ? (
                    <div style={{ padding: "12px 0", color: "#94a3b8" }}>No data available.</div>
                ) : (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Cycle</span>
                            <span style={{ fontWeight: 600 }}>{slipData.cycle?.cycle_name || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Position (at payout)</span>
                            <span style={{ fontWeight: 600 }}>{slipData.slip.position_name || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Department (at payout)</span>
                            <span style={{ fontWeight: 600 }}>{slipData.slip.department_name || "-"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Paid to Bank Account</span>
                            <span style={{ fontWeight: 600 }}>
                                {slipData.slip.bank_name || "-"} {slipData.slip.bank_account_no ? `(${slipData.slip.bank_account_no})` : ""}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>Net Pay</span>
                            <span style={{ fontWeight: 700 }}>฿{formatCurrency(slipData.slip.net_pay)}</span>
                        </div>
                        <div style={{ margin: "12px 0" }}>
                            <Badge status="cancelled">Read-only audit trail</Badge>
                        </div>
                        <Card style={{ padding: "0px" }}>
                            <Table columns={detailColumns} data={slipData.slip.details || []} />
                        </Card>
                    </>
                )}
            </Modal>
        </>
    );
};

export default TransactionsPage;
