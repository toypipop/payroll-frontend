import { useMemo, useState } from "react";
import useClosedCycleReport from "./shared/useClosedCycleReport";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";

const fc = (v) =>
    Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fd = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
};

// Excel/CSV export utilities
const exportExcel = (data) => {
    if (!data?.transactions?.length) return;
    const { cycle, company, transactions, summary } = data;

    const headers = [
        "Companies", "Code", "Employee Name", "Department", "Position",
        "Base Salary", "Gross Earnings", "Other Deductions", "SSO (Emp)", "Tax Withheld", "Net Pay",
    ];

    const rows = transactions.map((tx) => [
        tx.employees?.companies?.name || "",
        tx.employees?.employees_code || "",
        `${tx.employees?.first_name || ""} ${tx.employees?.last_name || ""}`,
        tx.employees?.department?.dept_name || "",
        tx.employees?.position?.pos_name || "",
        tx.salaries_at_time?.toFixed(2) || "0.00",
        tx.total_earning?.toFixed(2) || "0.00",
        tx.total_deduction?.toFixed(2) || "0.00",
        tx.sso_amount?.toFixed(2) || "0.00",
        tx.tax_amount?.toFixed(2) || "0.00",
        tx.net_pay?.toFixed(2) || "0.00",
    ]);

    const totalsRow = [
        "TOTAL", "", "", "", "",
        "",
        summary.total_gross.toFixed(2),
        summary.total_other_deductions.toFixed(2),
        summary.total_sso_employee.toFixed(2),
        summary.total_tax.toFixed(2),
        summary.total_net.toFixed(2),
    ];

    const csv = [headers, ...rows, [""], totalsRow]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PayrollRegister_${company?.name || "Company"}_${cycle?.cycle_name || ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

/* ── Summary Cards ──────────────────────────────────────────────────────── */
const SummaryCard = ({ label, value, color }) => (
    <div className="flex-[1_1_160px] rounded-[10px] border border-line-muted bg-white px-5 py-4">
        <div className="text-[11px] font-bold text-subtle uppercase tracking-[0.06em]">{label}</div>
        <div className="mt-1.5 font-mono text-xl font-extrabold text-main" style={color ? { color } : undefined}>฿{fc(value)}</div>
    </div>
);

/* ── Expanded Detail Panel ──────────────────────────────────────────────── */
const DetailPanel = ({ tx }) => {
    if (!tx) return null;
    const earnings = tx.details?.filter((d) => d.type === "earning") || [];
    const deductions = tx.details?.filter((d) => d.type === "deduction") || [];
    return (
        <div className="p-[16px_24px] bg-surface border-b border-b-line-muted">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[11px] font-bold text-success-text uppercase mb-[8px]">Earnings</div>
                    {earnings.map((d, i) => (
                        <div key={i} className="flex justify-between text-[13px] mb-[4px]">
                            <span className="text-body">{d.item_name}</span>
                            <span className="font-mono text-success-text">+{fc(d.amount)}</span>
                        </div>
                    ))}
                    {earnings.length === 0 && <div className="text-subtle text-[12px]">—</div>}
                </div>
                <div>
                    <div className="text-[11px] font-bold text-danger-text uppercase mb-[8px]">Deductions</div>
                    {deductions.map((d, i) => (
                        <div key={i} className="flex justify-between text-[13px] mb-[4px]">
                            <span className="text-body">{d.item_name}</span>
                            <span className="font-mono text-danger-text">({fc(d.amount)})</span>
                        </div>
                    ))}
                    {deductions.length === 0 && <div className="text-subtle text-[12px]">—</div>}
                </div>
            </div>
        </div>
    );
};

// Page component
const PayrollAnalysisPage = () => {
    const { cycles, selectedCycleId, setSelectedCycleId, data, loadingCycles, loadingData } =
        useClosedCycleReport((cycleId) => `/reports/payroll-analysis/${cycleId}`);
    const [expandedTx, setExpandedTx] = useState(null);
    const [activeTab, setActiveTab] = useState("register"); // "register" | "journal"

    // A new cycle's rows replace the old ones, so an expanded row from the previous cycle must not stay open.
    const selectCycle = (cycleId) => {
        setExpandedTx(null);
        setSelectedCycleId(cycleId);
    };

    const cycle = data?.cycle;
    const summary = data?.summary;
    const transactions = useMemo(() => data?.transactions || [], [data]);
    const journal = useMemo(() => data?.journal || [], [data]);

    const registerColumns = useMemo(() => [
        {
            label: "Employee",
            render: (tx) => (
                <div>
                    <div className="font-semibold text-main">
                        {tx.employees?.first_name} {tx.employees?.last_name}
                    </div>
                    <div className="text-[11px] text-subtle mt-[2px]">
                        {tx.employees?.employees_code} &middot; {tx.employees?.department?.dept_name || "—"}
                    </div>
                </div>
            ),
        },
        { label: "Base Salary", render: (tx) => <span className="font-mono">฿{fc(tx.salaries_at_time)}</span> },
        {
            label: "Gross Earnings",
            render: (tx) => <span className="font-mono text-success-text font-semibold">฿{fc(tx.total_earning)}</span>,
        },
        {
            label: "Deductions",
            render: (tx) => <span className="font-mono text-accent">({fc(tx.total_deduction)})</span>,
        },
        {
            label: "SSO",
            render: (tx) => <span className="font-mono text-primary">({fc(tx.sso_amount)})</span>,
        },
        {
            label: "Tax",
            render: (tx) => <span className="font-mono text-danger-text">({fc(tx.tax_amount)})</span>,
        },
        {
            label: "Net Pay",
            render: (tx) => <span className="font-mono font-extrabold text-[14px] text-main">฿{fc(tx.net_pay)}</span>,
        },
        { label: "Companies", render: (tx) => tx.employees?.companies?.name || "—" },
        {
            label: "",
            render: (tx) => (
                <Button
                    variant="ghost"
                    onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                    className="w-auto px-3 py-[5px] text-xs"
                >
                    {expandedTx === tx.id ? "▲ Hide" : "▼ Details"}
                </Button>
            ),
        },
    ], [expandedTx]);

    const journalColumns = [
        { label: "Account", render: (r) => <span className="font-medium">{r.account}</span> },
        {
            label: "Debit (฿)",
            render: (r) => r.debit > 0
                ? <span className="font-mono text-success-text font-semibold">{fc(r.debit)}</span>
                : <span className="text-subtle">—</span>,
        },
        {
            label: "Credit (฿)",
            render: (r) => r.credit > 0
                ? <span className="font-mono text-danger-text font-semibold">{fc(r.credit)}</span>
                : <span className="text-subtle">—</span>,
        },
    ];

    // The register table renders an expanded detail row under whichever row is open, so it is built inline rather than as a component.
    const renderRegisterTable = () => (
            <Table
                columns={registerColumns}
                data={transactions}
                getRowKey={(row) => row.id}
                renderAfterRow={(row, rowIndex, allRows) => {
                    if (expandedTx !== row.id) return null;
                    const isLastRow = rowIndex === allRows.length - 1;
                    return (
                        <tr className="bg-surface">
                            <td
                                colSpan={registerColumns.length}
                                className={`p-0 ${isLastRow ? "border-b-0" : "border-b border-line-muted"}`}
                            >
                                <DetailPanel tx={row} />
                            </td>
                        </tr>
                    );
                }}
            />
    );

    return (
        <>
            <PageHeader title="Payroll Analysis" />

            {/* Cycle selector */}
            <Card className="mb-5">
                {loadingCycles ? (
                    <div className="text-subtle text-[14px]">Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div className="text-subtle text-[14px]">No closed payroll cycles available.</div>
                ) : (
                    <>
                        <SelectField
                            label="Select Closed Payroll Cycle"
                            options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                            value={selectedCycleId}
                            onChange={(e) => selectCycle(e.target.value)}
                            containerClassName="mb-0"
                        />
                        {cycle && (
                            <div className="mt-[10px] text-[13px] text-muted flex items-center gap-[10px]">
                                Period: <strong>{fd(cycle.start_date)}</strong> —&nbsp;<strong>{fd(cycle.end_date)}</strong>
                                <Badge status="cancelled">Closed / Locked</Badge>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Summary Cards */}
            {summary && (
                <div className="flex flex-wrap gap-[12px] mb-[20px]">
                    <SummaryCard label="Total Gross Earnings" value={summary.total_gross} color="var(--status-success-text)" />
                    <SummaryCard label="Other Deductions" value={summary.total_other_deductions} color="var(--accent-color)" />
                    <SummaryCard label="SSO (Employee + Employer)" value={summary.total_sso_employee + summary.total_sso_employer} color="var(--primary-color)" />
                    <SummaryCard label="Tax Withheld" value={summary.total_tax} color="var(--status-danger-text)" />
                    <SummaryCard label="Total Net Pay" value={summary.total_net} color="var(--text-main)" />
                </div>
            )}

            {/* Tab Switcher & Actions */}
            {data && transactions.length > 0 && (
                <div className="flex items-center flex-wrap mb-[16px] border-b border-b-line-muted gap-[4px]">
                    {[
                        { key: "register", label: "Payroll Register" },
                        { key: "journal", label: "Journal Summary" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`-mb-px cursor-pointer border-none border-b-2 bg-transparent px-4 py-2.5 text-[13px] transition-colors ${
                                activeTab === tab.key
                                    ? "border-b-control font-bold text-control"
                                    : "border-b-transparent font-medium text-muted"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <Button variant="secondary" onClick={() => exportExcel(data)} className="mb-2 w-auto px-[18px] py-[9px]">
                        Export to Excel/CSV
                    </Button>
                </div>
            )}

            {/* Register Table */}
            {activeTab === "register" && (
                <Card className="p-0">
                    {loadingData ? (
                        <div className="p-[40px] text-center text-subtle">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-[40px] text-center text-subtle">
                            {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                        </div>
                    ) : (
                        <>
                            {renderRegisterTable()}
                            <div className="p-[14px_20px] border-t border-t-line-muted flex justify-end gap-[24px] text-[13px] bg-surface flex-wrap">
                                <span className="text-muted">Employees: <strong>{transactions.length}</strong></span>
                                <span className="text-success-text">Gross: <strong className="font-mono">฿{fc(summary?.total_gross)}</strong></span>
                                <span className="text-danger-text">Tax: <strong className="font-mono">{fc(summary?.total_tax)}</strong></span>
                                <span className="text-main font-extrabold font-mono text-[15px]">Net: ฿{fc(summary?.total_net)}</span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {/* Journal Summary */}
            {activeTab === "journal" && (
                <Card className="p-0">
                    {!journal.length ? (
                        <div className="p-[40px] text-center text-subtle">No journal data.</div>
                    ) : (
                        <>
                            <div className="p-[16px_20px] border-b border-b-line-muted bg-surface">
                                <div className="text-[13px] font-bold text-main">
                                    Journal Entry — {cycle?.cycle_name}
                                </div>
                                <div className="text-[12px] text-muted mt-[2px]">
                                    {data?.company?.name} &nbsp;|&nbsp; {fd(cycle?.start_date)} — {fd(cycle?.end_date)}
                                </div>
                            </div>
                            <Table columns={journalColumns} data={journal} />
                            <div className="p-[14px_20px] border-t border-t-line-muted flex justify-end gap-[32px] text-[13px] bg-surface">
                                <span className="text-success-text">
                                    Total Debit: <strong className="font-mono">
                                        ฿{fc(journal.reduce((s, r) => s + r.debit, 0))}
                                    </strong>
                                </span>
                                <span className="text-danger-text">
                                    Total Credit: <strong className="font-mono">
                                        ฿{fc(journal.reduce((s, r) => s + r.credit, 0))}
                                    </strong>
                                </span>
                            </div>
                        </>
                    )}
                </Card>
            )}
        </>
    );
};

export default PayrollAnalysisPage;
