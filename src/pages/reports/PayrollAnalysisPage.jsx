import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axiosInstance";
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

/* ── Excel / CSV Export ─────────────────────────────────────────────────── */
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
        border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px",
        background: "#fff", flex: "1 1 160px",
    }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontFamily: "monospace", fontWeight: "800", fontSize: "20px", color: color || "#0f172a", marginTop: "6px" }}>฿{fc(value)}</div>
    </div>
);

/* ── Expanded Detail Panel ──────────────────────────────────────────────── */
const DetailPanel = ({ tx }) => {
    if (!tx) return null;
    const earnings = tx.details?.filter((d) => d.type === "earning") || [];
    const deductions = tx.details?.filter((d) => d.type === "deduction") || [];
    return (
        <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#059669", textTransform: "uppercase", marginBottom: "8px" }}>Earnings</div>
                    {earnings.map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <span style={{ color: "#475569" }}>{d.item_name}</span>
                            <span style={{ fontFamily: "monospace", color: "#059669" }}>+{fc(d.amount)}</span>
                        </div>
                    ))}
                    {earnings.length === 0 && <div style={{ color: "#94a3b8", fontSize: "12px" }}>—</div>}
                </div>
                <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase", marginBottom: "8px" }}>Deductions</div>
                    {deductions.map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <span style={{ color: "#475569" }}>{d.item_name}</span>
                            <span style={{ fontFamily: "monospace", color: "#dc2626" }}>({fc(d.amount)})</span>
                        </div>
                    ))}
                    {deductions.length === 0 && <div style={{ color: "#94a3b8", fontSize: "12px" }}>—</div>}
                </div>
            </div>
        </div>
    );
};

/* ── Page Component ─────────────────────────────────────────────────────── */
const PayrollAnalysisPage = () => {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [data, setData] = useState(null);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [expandedTx, setExpandedTx] = useState(null);
    const [activeTab, setActiveTab] = useState("register"); // "register" | "journal"

    useEffect(() => {
        (async () => {
            try {
                setLoadingCycles(true);
                const res = await api.get("/payroll/cycles");
                const closed = (res.data || []).filter((c) => c.is_closed);
                setCycles(closed);
                if (closed.length > 0) setSelectedCycleId(String(closed[0].id));
            } catch { /* silent */ } finally { setLoadingCycles(false); }
        })();
    }, []);

    useEffect(() => {
        if (!selectedCycleId) return;
        (async () => {
            try {
                setLoadingData(true);
                setData(null);
                setExpandedTx(null);
                const res = await api.get(`/reports/payroll-analysis/${selectedCycleId}`);
                setData(res.data);
            } catch { setData(null); } finally { setLoadingData(false); }
        })();
    }, [selectedCycleId]);

    const cycle = data?.cycle;
    const summary = data?.summary;
    const transactions = useMemo(() => data?.transactions || [], [data]);
    const journal = useMemo(() => data?.journal || [], [data]);

    const registerColumns = useMemo(() => [
        {
            label: "Employee",
            render: (tx) => (
                <div>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>
                        {tx.employees?.first_name} {tx.employees?.last_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
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
            render: (tx) => <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>({fc(tx.total_deduction)})</span>,
        },
        {
            label: "SSO",
            render: (tx) => <span style={{ fontFamily: "monospace", color: "#0369a1" }}>({fc(tx.sso_amount)})</span>,
        },
        {
            label: "Tax",
            render: (tx) => <span style={{ fontFamily: "monospace", color: "#dc2626" }}>({fc(tx.tax_amount)})</span>,
        },
        {
            label: "Net Pay",
            render: (tx) => <span style={{ fontFamily: "monospace", fontWeight: "800", fontSize: "14px", color: "#0f172a" }}>฿{fc(tx.net_pay)}</span>,
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
                : <span style={{ color: "#94a3b8" }}>—</span>,
        },
        {
            label: "Credit (฿)",
            render: (r) => r.credit > 0
                ? <span style={{ fontFamily: "monospace", color: "#dc2626", fontWeight: "600" }}>{fc(r.credit)}</span>
                : <span style={{ color: "#94a3b8" }}>—</span>,
        },
    ];

    // Custom register table wrapper component
    const RegisterTable = () => {
        return (
            <Table
                columns={registerColumns}
                data={transactions}
                getRowKey={(row) => row.id}
                renderAfterRow={(row, rowIndex, allRows) => {
                    if (expandedTx !== row.id) return null;
                    const isLastRow = rowIndex === allRows.length - 1;
                    return (
                        <tr style={{ backgroundColor: "#f8fafc" }}>
                            <td
                                colSpan={registerColumns.length}
                                style={{ padding: 0, borderBottom: isLastRow ? "none" : "1px solid #e2e8f0" }}
                            >
                                <DetailPanel tx={row} />
                            </td>
                        </tr>
                    );
                }}
            />
        );
    };

    return (
        <>
            <PageHeader title="Payroll Analysis" />

            {/* Cycle selector */}
            <Card style={{ marginBottom: "20px" }}>
                {loadingCycles ? (
                    <div style={{ color: "#94a3b8", fontSize: "14px" }}>Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: "14px" }}>No closed payroll cycles available.</div>
                ) : (
                    <>
                        <SelectField
                            label="Select Closed Payroll Cycle"
                            options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            containerStyle={{ marginBottom: 0 }}
                        />
                        {cycle && (
                            <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
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
                    <SummaryCard label="Other Deductions" value={summary.total_other_deductions} color="#f59e0b" />
                    <SummaryCard label="SSO (Employee + Employer)" value={summary.total_sso_employee + summary.total_sso_employer} color="#0369a1" />
                    <SummaryCard label="Tax Withheld" value={summary.total_tax} color="#dc2626" />
                    <SummaryCard label="Total Net Pay" value={summary.total_net} color="#0f172a" />
                </div>
            )}

            {/* Actions & Tab Switcher */}
            {data && transactions.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    <Button
                        variant={activeTab === "register" ? "primary" : "secondary"}
                        onClick={() => setActiveTab("register")}
                        style={{ width: "auto", padding: "9px 18px" }}
                    >
                        Payroll Register
                    </Button>
                    <Button
                        variant={activeTab === "journal" ? "primary" : "secondary"}
                        onClick={() => setActiveTab("journal")}
                        style={{ width: "auto", padding: "9px 18px" }}
                    >
                        Journal Summary
                    </Button>
                    <div style={{ flex: 1 }} />
                    <Button variant="secondary" onClick={() => exportExcel(data)} style={{ width: "auto", padding: "9px 18px" }}>
                        Export to Excel/CSV
                    </Button>
                </div>
            )}

            {/* Register Table */}
            {activeTab === "register" && (
                <Card style={{ padding: 0 }}>
                    {loadingData ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                            {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                        </div>
                    ) : (
                        <>
                            <RegisterTable />
                            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "24px", fontSize: "13px", background: "#f8fafc", flexWrap: "wrap" }}>
                                <span style={{ color: "#64748b" }}>Employees: <strong>{transactions.length}</strong></span>
                                <span style={{ color: "#064e3b" }}>Gross: <strong style={{ fontFamily: "monospace" }}>฿{fc(summary?.total_gross)}</strong></span>
                                <span style={{ color: "#dc2626" }}>Tax: <strong style={{ fontFamily: "monospace" }}>{fc(summary?.total_tax)}</strong></span>
                                <span style={{ color: "#0f172a", fontWeight: "800", fontFamily: "monospace", fontSize: "15px" }}>Net: ฿{fc(summary?.total_net)}</span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {/* Journal Summary */}
            {activeTab === "journal" && (
                <Card style={{ padding: 0 }}>
                    {!journal.length ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No journal data.</div>
                    ) : (
                        <>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                                    Journal Entry — {cycle?.cycle_name}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                    {data?.company?.name} &nbsp;|&nbsp; {fd(cycle?.start_date)} — {fd(cycle?.end_date)}
                                </div>
                            </div>
                            <Table columns={journalColumns} data={journal} />
                            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "32px", fontSize: "13px", background: "#f8fafc" }}>
                                <span style={{ color: "#064e3b" }}>
                                    Total Debit: <strong style={{ fontFamily: "monospace" }}>
                                        ฿{fc(journal.reduce((s, r) => s + r.debit, 0))}
                                    </strong>
                                </span>
                                <span style={{ color: "#dc2626" }}>
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
