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
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
    <div style={{
        border: "1px solid var(--border-muted)", borderRadius: "10px", padding: "16px 20px",
        background: "#fff", flex: "1 1 160px",
    }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontFamily: "monospace", fontWeight: "800", fontSize: "20px", color: color || "var(--text-main)", marginTop: "6px" }}>฿{fc(value)}</div>
    </div>
);

/* ── Expanded Detail Panel ──────────────────────────────────────────────── */
const DetailPanel = ({ tx }) => {
    if (!tx) return null;
    const earnings = tx.details?.filter((d) => d.type === "earning") || [];
    const deductions = tx.details?.filter((d) => d.type === "deduction") || [];
    return (
        <div style={{ padding: "16px 24px", background: "var(--surface-subtle)", borderBottom: "1px solid var(--border-muted)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#059669", textTransform: "uppercase", marginBottom: "8px" }}>Earnings</div>
                    {earnings.map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <span style={{ color: "var(--text-body)" }}>{d.item_name}</span>
                            <span style={{ fontFamily: "monospace", color: "#059669" }}>+{fc(d.amount)}</span>
                        </div>
                    ))}
                    {earnings.length === 0 && <div style={{ color: "var(--text-subtle)", fontSize: "12px" }}>—</div>}
                </div>
                <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--status-danger-text)", textTransform: "uppercase", marginBottom: "8px" }}>Deductions</div>
                    {deductions.map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <span style={{ color: "var(--text-body)" }}>{d.item_name}</span>
                            <span style={{ fontFamily: "monospace", color: "var(--status-danger-text)" }}>({fc(d.amount)})</span>
                        </div>
                    ))}
                    {deductions.length === 0 && <div style={{ color: "var(--text-subtle)", fontSize: "12px" }}>—</div>}
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
                    <div style={{ fontWeight: "600", color: "var(--text-main)" }}>
                        {tx.employees?.first_name} {tx.employees?.last_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "2px" }}>
                        {tx.employees?.employees_code} &middot; {tx.employees?.department?.dept_name || "—"}
                    </div>
                </div>
            ),
        },
        { label: "Base Salary", render: (tx) => <span style={{ fontFamily: "monospace" }}>฿{fc(tx.salaries_at_time)}</span> },
        {
            label: "Gross Earnings",
            render: (tx) => <span style={{ fontFamily: "monospace", color: "#059669", fontWeight: "600" }}>฿{fc(tx.total_earning)}</span>,
        },
        {
            label: "Deductions",
            render: (tx) => <span style={{ fontFamily: "monospace", color: "var(--accent-color)" }}>({fc(tx.total_deduction)})</span>,
        },
        {
            label: "SSO",
            render: (tx) => <span style={{ fontFamily: "monospace", color: "#0369a1" }}>({fc(tx.sso_amount)})</span>,
        },
        {
            label: "Tax",
            render: (tx) => <span style={{ fontFamily: "monospace", color: "var(--status-danger-text)" }}>({fc(tx.tax_amount)})</span>,
        },
        {
            label: "Net Pay",
            render: (tx) => <span style={{ fontFamily: "monospace", fontWeight: "800", fontSize: "14px", color: "var(--text-main)" }}>฿{fc(tx.net_pay)}</span>,
        },
        { label: "Companies", render: (tx) => tx.employees?.companies?.name || "—" },
        {
            label: "",
            render: (tx) => (
                <Button
                    variant="ghost"
                    onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                    style={{ fontSize: "12px", padding: "5px 12px", width: "auto" }}
                >
                    {expandedTx === tx.id ? "▲ Hide" : "▼ Details"}
                </Button>
            ),
        },
    ], [expandedTx]);

    const journalColumns = [
        { label: "Account", render: (r) => <span style={{ fontWeight: "500" }}>{r.account}</span> },
        {
            label: "Debit (฿)",
            render: (r) => r.debit > 0
                ? <span style={{ fontFamily: "monospace", color: "#059669", fontWeight: "600" }}>{fc(r.debit)}</span>
                : <span style={{ color: "var(--text-subtle)" }}>—</span>,
        },
        {
            label: "Credit (฿)",
            render: (r) => r.credit > 0
                ? <span style={{ fontFamily: "monospace", color: "var(--status-danger-text)", fontWeight: "600" }}>{fc(r.credit)}</span>
                : <span style={{ color: "var(--text-subtle)" }}>—</span>,
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
                        <tr style={{ backgroundColor: "var(--surface-subtle)" }}>
                            <td
                                colSpan={registerColumns.length}
                                style={{ padding: 0, borderBottom: isLastRow ? "none" : "1px solid var(--border-muted)" }}
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
            <Card style={{ marginBottom: "20px" }}>
                {loadingCycles ? (
                    <div style={{ color: "var(--text-subtle)", fontSize: "14px" }}>Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div style={{ color: "var(--text-subtle)", fontSize: "14px" }}>No closed payroll cycles available.</div>
                ) : (
                    <>
                        <SelectField
                            label="Select Closed Payroll Cycle"
                            options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                            value={selectedCycleId}
                            onChange={(e) => selectCycle(e.target.value)}
                            containerStyle={{ marginBottom: 0 }}
                        />
                        {cycle && (
                            <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
                                Period: <strong>{fd(cycle.start_date)}</strong> —&nbsp;<strong>{fd(cycle.end_date)}</strong>
                                <Badge status="cancelled">Closed / Locked</Badge>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Summary Cards */}
            {summary && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                    <SummaryCard label="Total Gross Earnings" value={summary.total_gross} color="#059669" />
                    <SummaryCard label="Other Deductions" value={summary.total_other_deductions} color="var(--accent-color)" />
                    <SummaryCard label="SSO (Employee + Employer)" value={summary.total_sso_employee + summary.total_sso_employer} color="#0369a1" />
                    <SummaryCard label="Tax Withheld" value={summary.total_tax} color="var(--status-danger-text)" />
                    <SummaryCard label="Total Net Pay" value={summary.total_net} color="var(--text-main)" />
                </div>
            )}

            {/* Tab Switcher & Actions */}
            {data && transactions.length > 0 && (
                <div style={{
                    display: "flex", alignItems: "center", flexWrap: "wrap",
                    marginBottom: "16px", borderBottom: "1px solid var(--border-muted)", gap: "4px",
                }}>
                    {[
                        { key: "register", label: "Payroll Register" },
                        { key: "journal", label: "Journal Summary" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: "10px 16px",
                                background: "transparent",
                                border: "none",
                                borderBottom: activeTab === tab.key ? "2px solid var(--control-accent)" : "2px solid transparent",
                                marginBottom: "-1px",
                                fontSize: "13px",
                                fontWeight: activeTab === tab.key ? 700 : 500,
                                color: activeTab === tab.key ? "var(--control-accent)" : "var(--text-muted)",
                                cursor: "pointer",
                                transition: "color 0.15s, border-color 0.15s",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <div style={{ flex: 1 }} />
                    <Button variant="secondary" onClick={() => exportExcel(data)} style={{ width: "auto", padding: "9px 18px", marginBottom: "8px" }}>
                        Export to Excel/CSV
                    </Button>
                </div>
            )}

            {/* Register Table */}
            {activeTab === "register" && (
                <Card style={{ padding: 0 }}>
                    {loadingData ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>
                            {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                        </div>
                    ) : (
                        <>
                            {renderRegisterTable()}
                            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-muted)", display: "flex", justifyContent: "flex-end", gap: "24px", fontSize: "13px", background: "var(--surface-subtle)", flexWrap: "wrap" }}>
                                <span style={{ color: "var(--text-muted)" }}>Employees: <strong>{transactions.length}</strong></span>
                                <span style={{ color: "#064e3b" }}>Gross: <strong style={{ fontFamily: "monospace" }}>฿{fc(summary?.total_gross)}</strong></span>
                                <span style={{ color: "var(--status-danger-text)" }}>Tax: <strong style={{ fontFamily: "monospace" }}>{fc(summary?.total_tax)}</strong></span>
                                <span style={{ color: "var(--text-main)", fontWeight: "800", fontFamily: "monospace", fontSize: "15px" }}>Net: ฿{fc(summary?.total_net)}</span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {/* Journal Summary */}
            {activeTab === "journal" && (
                <Card style={{ padding: 0 }}>
                    {!journal.length ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>No journal data.</div>
                    ) : (
                        <>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-muted)", background: "var(--surface-subtle)" }}>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                                    Journal Entry — {cycle?.cycle_name}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                                    {data?.company?.name} &nbsp;|&nbsp; {fd(cycle?.start_date)} — {fd(cycle?.end_date)}
                                </div>
                            </div>
                            <Table columns={journalColumns} data={journal} />
                            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-muted)", display: "flex", justifyContent: "flex-end", gap: "32px", fontSize: "13px", background: "var(--surface-subtle)" }}>
                                <span style={{ color: "#064e3b" }}>
                                    Total Debit: <strong style={{ fontFamily: "monospace" }}>
                                        ฿{fc(journal.reduce((s, r) => s + r.debit, 0))}
                                    </strong>
                                </span>
                                <span style={{ color: "var(--status-danger-text)" }}>
                                    Total Credit: <strong style={{ fontFamily: "monospace" }}>
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
