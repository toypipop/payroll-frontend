import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";
import HelpIcon from "../../components/common/HelpIcon";
import MasterDataWarning from "../../components/common/MasterDataWarning";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DetailDropdown = ({ total, details, color, filterFn }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const filtered = details.filter(filterFn || (() => true));
    const hasDetails = filtered.length > 0;

    const handleToggle = () => {
        if (!hasDetails) return;
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
        }
        setOpen(o => !o);
    };

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [open]);

    return (
        <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
            <button
                ref={btnRef}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                style={{
                    background: "none", border: "none", padding: 0, cursor: hasDetails ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: "4px", fontFamily: "monospace", fontSize: "12px",
                }}
            >
                <span style={{ fontWeight: "700", color }}>฿{formatCurrency(total)}</span>
                {hasDetails && <span style={{ fontSize: "10px", color: "#94a3b8" }}>{open ? "▲" : "▼"}</span>}
            </button>
            {open && hasDetails && ReactDOM.createPortal(
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute", zIndex: 9999, top: pos.top, left: pos.left,
                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "8px 0", minWidth: "210px",
                    }}
                >
                    {filtered.map((d, i) => (
                        <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "5px 14px", fontSize: "12px", gap: "16px",
                            borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                        }}>
                            <span style={{ color: "#475569", whiteSpace: "nowrap" }}>{d.item_name}</span>
                            <span style={{ color, fontWeight: "600", whiteSpace: "nowrap" }}>฿{formatCurrency(d.amount)}</span>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

const RunPayrollPage = () => {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [selectedCycle, setSelectedCycle] = useState(null); // Track cycle object
    const [transactions, setTransactions] = useState([]);
    const [payrollConfig, setPayrollConfig] = useState(null);  // FIX: Store cycle's config
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);  // FIX: Track config loading state
    const [calculating, setCalculating] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [preCheckIssues, setPreCheckIssues] = useState<any[]>([]);
    const [pendingCalculate, setPendingCalculate] = useState(false);
    const [diffData, setDiffData] = useState<any>(null);

    const fetchCycles = async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get("/payroll/cycles");
            const open = (res.data || []).filter((c) => !c.is_closed);
            setCycles(open);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCycles(false);
        }
    };

    const fetchTransactions = async (cycleId) => {
        if (!cycleId) return;
        try {
            setLoadingTx(true);
            const res = await api.get(`/payroll/transactions/${cycleId}`);
            // Trigger React re-render via immutability
            setTransactions([...(res.data.transactions || [])]);
        } catch (err) {
            setTransactions([]);
            if (err.response?.status !== 404) console.error(err);
        } finally {
            setLoadingTx(false);
        }
    };

    // Fetch config for selected cycle's company
    const fetchPayrollConfigForCycle = async (cycle) => {
        if (!cycle?.id) {
            console.warn("Cannot fetch config: cycle object missing or invalid", cycle);
            setPayrollConfig(null);
            return;
        }
        try {
            setLoadingConfig(true);
            console.log("Fetching config for cycle:", cycle.id, "Company:", cycle.companies?.name || cycle.companies_id);
            const res = await api.get(`/payroll/config/${cycle.id}`);
            console.log("Config response:", res.data);
            if (res.data?.config) {
                setPayrollConfig(res.data.config);
                console.log("Config set successfully:", res.data.config);
            } else {
                console.warn("Config response missing config field:", res.data);
                setPayrollConfig(null);
            }
        } catch (err) {
            console.error("Failed to fetch payroll config:", err.response?.data || err.message);
            setPayrollConfig(null);
        } finally {
            setLoadingConfig(false);
        }
    };

    useEffect(() => { fetchCycles(); }, []);

    // Load cycle and fetch its config
    useEffect(() => {
        if (selectedCycleId && cycles.length > 0) {
            const cycle = cycles.find((c) => String(c.id) === String(selectedCycleId));
            if (cycle) {
                setSelectedCycle(cycle);
                fetchTransactions(selectedCycleId);
                // Fetch config for this cycle's company
                fetchPayrollConfigForCycle(cycle);
            }
        }
    }, [selectedCycleId, cycles]);

    const runCalculate = async () => {
        if (!selectedCycleId || !selectedCycle) return;
        setPreCheckIssues([]);
        setPendingCalculate(false);
        try {
            setCalculating(true);
            setCalcResult(null);
            setDiffData(null);
            setTransactions([]);
            await fetchPayrollConfigForCycle(selectedCycle);
            const res = await api.post(`/payroll/calculate/${selectedCycleId}`);
            setCalcResult(res.data);
            await fetchTransactions(selectedCycleId);
            const diffRes = await api.get(`/payroll/diff/${selectedCycleId}`);
            setDiffData(diffRes.data);
        } catch (err) {
            alert(err.response?.data?.error || "Calculation failed");
        } finally {
            setCalculating(false);
        }
    };

    const handleCalculate = async () => {
        if (!selectedCycleId || !selectedCycle) return;
        try {
            const res = await api.get(`/payroll/pre-check/${selectedCycleId}`);
            const { ok, issues } = res.data;
            if (ok) {
                runCalculate();
            } else {
                setPreCheckIssues(issues || []);
                setPendingCalculate(true);
            }
        } catch {
            runCalculate();
        }
    };

    const columns = [
        {
            label: "Employee",
            sortKey: "employees.first_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.toLowerCase(),
            searchableKeys: ["employees.first_name", "employees.last_name", "employees.employees_code"],
            render: (row) => (
                <div>
                    <div style={{ fontWeight: "600", color: "#1e293b" }}>
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        {row.employees?.employees_code} · {row.employees?.department?.dept_name || "—"}
                    </div>
                </div>
            ),
        },
        {
            label: "Companies",
            sortKey: "employees.companies.name",
            searchableKeys: ["employees.companies.name"],
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Position",
            sortKey: "employees.position.pos_name",
            searchableKeys: ["employees.position.pos_name"],
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#475569" }}>
                    {row.employees?.position?.pos_name || "—"}
                </span>
            ),
        },
        {
            label: "Base Salary",
            sortKey: "salaries_at_time",
            sortValue: (row) => row.salaries_at_time || 0,
            render: (row) => (
                <span style={{ fontFamily: "monospace" }}>฿{formatCurrency(row.salaries_at_time)}</span>
            ),
        },
        {
            label: "Earning",
            sortKey: "total_earning",
            sortValue: (row) => row.total_earning || 0,
            render: (row) => {
                const extras = (row.details || []).filter(d => d.type === "earning" && d.item_name !== "Base Salary");
                const extrasTotal = extras.reduce((s, d) => s + (d.amount || 0), 0);
                return (
                    <DetailDropdown
                        total={extrasTotal}
                        details={row.details || []}
                        color="#10b981"
                        filterFn={(d) => d.type === "earning" && d.item_name !== "Base Salary"}
                    />
                );
            },
        },
        {
            label: "Deductions",
            sortKey: "total_deduction",
            sortValue: (row) => row.total_deduction || 0,
            render: (row) => (
                <DetailDropdown
                    total={row.total_deduction}
                    details={row.details || []}
                    color="#ef4444"
                    filterFn={(d) => d.type === "deduction" && d.item_name !== "Social Security (SSO)" && d.item_name !== "Income Tax"}
                />
            ),
        },
        {
            label: "SSO",
            sortKey: "sso_amount",
            sortValue: (row) => row.sso_amount || 0,
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>
                    ฿{formatCurrency(row.sso_amount)}
                </span>
            ),
        },
        {
            label: "Tax",
            sortKey: "tax_amount",
            sortValue: (row) => row.tax_amount || 0,
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>
                    ฿{formatCurrency(row.tax_amount)}
                </span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            sortValue: (row) => row.net_pay || 0,
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>
                    ฿{formatCurrency(row.net_pay)}
                </span>
            ),
        },
    ];

    const totalNetPay = transactions.reduce((sum, t) => sum + (t.net_pay || 0), 0);
    const totalEarning = transactions.reduce((sum, t) => sum + (t.total_earning || 0), 0);

    return (
        <>
            <PageHeader title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Run Payroll<HelpIcon articleId="run-payroll" /></span>} />

            {/* Cycle selector + Run button */}
            <Card style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "220px" }}>
                        {loadingCycles ? (
                            <div style={{ color: "#94a3b8", fontSize: "14px" }}>Loading cycles...</div>
                        ) : cycles.length === 0 ? (
                            <div style={{ color: "#94a3b8", fontSize: "14px" }}>No open cycles available.</div>
                        ) : (
                            <SelectField
                                label="Select Open Cycle"
                                options={cycles.map((c) => {
                                    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
                                    const dateRange = (c.start_date && c.end_date) ? ` · ${fmt(c.start_date)} – ${fmt(c.end_date)}` : "";
                                    return { id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}${dateRange}` };
                                })}
                                value={selectedCycleId}
                                onChange={(e) => {
                                    const cycleId = e.target.value;
                                    setSelectedCycleId(cycleId);
                                    setPreCheckIssues([]);
                                    setPendingCalculate(false);
                                    setDiffData(null);
                                    const cycle = cycles.find((c) => String(c.id) === String(cycleId));
                                    if (cycle) setSelectedCycle(cycle);
                                }}
                                containerStyle={{ marginBottom: 0 }}
                            />
                        )}
                    </div>

                    <Button
                        onClick={handleCalculate}
                        disabled={!selectedCycleId || calculating}
                        style={{
                            width: "auto", marginTop: "20px",
                            opacity: (!selectedCycleId || calculating) ? 0.6 : 1,
                            cursor: (!selectedCycleId || calculating) ? "not-allowed" : "pointer",
                        }}
                    >
                        {calculating ? "⏳ Calculating..." : "▶ Run Calculation"}
                    </Button>
                </div>

                {/* SSO / Payroll Parameters */}
                {loadingConfig ? (
                    <div style={{ marginTop: "16px", fontSize: "13px", color: "#94a3b8" }}>
                        Loading parameters...
                    </div>
                ) : !payrollConfig ? (
                    selectedCycle && (
                        <div style={{ marginTop: "16px" }}>
                            <MasterDataWarning
                                message={`No payroll config found for ${selectedCycle.companies?.name || "this company"}. Configure it in Payroll Setup.`}
                                routePath="/payroll-global"
                                moduleKey="PayrollGlobalSettingsPage"
                            />
                        </div>
                    )
                ) : (
                    <div style={{
                        marginTop: "16px",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                    }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                            {selectedCycle?.companies?.name || "Company"} · Payroll Parameters
                        </div>
                        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                            {[
                                { label: "SSO Rate", value: `${payrollConfig.sso_rate}%` },
                                { label: "SSO Max", value: `฿${formatCurrency(payrollConfig.sso_max_amount)}` },
                                { label: "Min Salary", value: `฿${formatCurrency(payrollConfig.sso_min_salary)}` },
                                { label: "Tax Method", value: payrollConfig.tax_calculation || "Progressive" },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px" }}>{item.label}</div>
                                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pre-check warning panel */}
                {preCheckIssues.length > 0 && (
                    <div style={{
                        marginTop: "12px", padding: "14px 16px",
                        borderRadius: "8px", backgroundColor: "#fffbeb",
                        border: "1px solid #fcd34d",
                    }}>
                        <div style={{ fontWeight: "600", color: "#92400e", marginBottom: "8px", fontSize: "13px" }}>
                            ⚠ Issues found before Run Payroll
                        </div>
                        {preCheckIssues.map((issue, i) => (
                            <div key={i} style={{ marginBottom: "8px" }}>
                                <div style={{ fontSize: "13px", color: "#78350f" }}>{issue.message}</div>
                                {issue.employees?.length > 0 && (
                                    <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "#92400e" }}>
                                        {issue.employees.map((name: string) => <li key={name}>{name}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                        {pendingCalculate && (
                            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                                <button
                                    onClick={runCalculate}
                                    style={{
                                        padding: "6px 14px", borderRadius: "6px", border: "1px solid #d97706",
                                        background: "#f59e0b", color: "#fff", fontSize: "13px",
                                        fontWeight: "600", cursor: "pointer",
                                    }}
                                >
                                    Proceed Anyway
                                </button>
                                <button
                                    onClick={() => { setPreCheckIssues([]); setPendingCalculate(false); }}
                                    style={{
                                        padding: "6px 14px", borderRadius: "6px", border: "1px solid #e2e8f0",
                                        background: "#fff", color: "#475569", fontSize: "13px", cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Calculation result banner */}
                {calcResult && (
                    <div style={{
                        marginTop: "12px", padding: "10px 14px",
                        borderRadius: "8px", backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0", color: "#15803d", fontSize: "13px",
                    }}>
                        <strong>{calcResult.processed_count}</strong> employees processed
                        {calcResult.skipped_count > 0 && (
                            <span style={{ color: "#92400e" }}> · {calcResult.skipped_count} skipped (no salary record)</span>
                        )}
                        {calcResult.skipped_employees?.length > 0 && (
                            <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "12px", color: "#92400e" }}>
                                {calcResult.skipped_employees.map((name: string) => <li key={name}>{name}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* Informational note: new hires whose first pay this cycle was
                    pro-rated because they started mid-cycle. Not a warning — just
                    explaining why their amount looks lower than a full month. */}
                {calcResult?.prorated_employees?.length > 0 && (
                    <div style={{
                        marginTop: "10px", padding: "10px 14px",
                        borderRadius: "8px", backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "13px",
                    }}>
                        <strong>{calcResult.prorated_employees.length}</strong> new hire{calcResult.prorated_employees.length > 1 ? "s" : ""} paid pro-rated this cycle (started mid-cycle)
                        <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "12px" }}>
                            {calcResult.prorated_employees.map((p: { name: string; days: number; total_days: number }) => (
                                <li key={p.name}>{p.name} — {p.days}/{p.total_days} days</li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card>

            {/* Diff summary vs previous cycle */}
            {diffData?.has_previous && diffData.current && diffData.previous && (() => {
                const cur = diffData.current;
                const prv = diffData.previous;
                const fmt = (v: number) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                const diff = (a: number, b: number) => {
                    const d = a - b;
                    const sign = d > 0 ? "+" : "";
                    const color = d > 0 ? "#10b981" : d < 0 ? "#ef4444" : "#94a3b8";
                    return <span style={{ color, fontSize: "11px", fontWeight: 600 }}>{sign}{fmt(d)}</span>;
                };
                const rows = [
                    { label: "Employees", cur: cur.employee_count, prv: prv.employee_count, prefix: "" },
                    { label: "Net Pay (฿)", cur: cur.net_pay, prv: prv.net_pay, prefix: "฿" },
                    { label: "Total Earning (฿)", cur: cur.total_earning, prv: prv.total_earning, prefix: "฿" },
                    { label: "Deductions (฿)", cur: cur.total_deduction, prv: prv.total_deduction, prefix: "฿" },
                    { label: "SSO (฿)", cur: cur.sso_amount, prv: prv.sso_amount, prefix: "฿" },
                ];
                return (
                    <Card style={{ marginBottom: "20px", padding: "16px 20px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                            เปรียบเทียบกับรอบที่แล้ว · {prv.cycle_name}
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ color: "#94a3b8", fontWeight: 600, fontSize: "11px" }}>
                                        <th style={{ textAlign: "left", padding: "4px 8px 8px 0" }}></th>
                                        <th style={{ textAlign: "right", padding: "4px 8px 8px" }}>{prv.cycle_name}</th>
                                        <th style={{ textAlign: "right", padding: "4px 8px 8px" }}>{cur.cycle_name}</th>
                                        <th style={{ textAlign: "right", padding: "4px 0 8px 8px" }}>เปลี่ยน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.label} style={{ borderTop: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "7px 8px 7px 0", color: "#475569" }}>{r.label}</td>
                                            <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: "monospace", color: "#94a3b8" }}>{r.prefix}{fmt(r.prv)}</td>
                                            <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{r.prefix}{fmt(r.cur)}</td>
                                            <td style={{ textAlign: "right", padding: "7px 0 7px 8px", fontFamily: "monospace" }}>{diff(r.cur, r.prv)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                );
            })()}

            {/* Summary strip */}
            {transactions.length > 0 && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    {[
                        { label: "Employees", value: transactions.length, color: "#3b82f6" },
                        { label: "Total Earning", value: `฿${formatCurrency(totalEarning)}`, color: "#10b981" },
                        { label: "Total Net Pay", value: `฿${formatCurrency(totalNetPay)}`, color: "#0f172a" },
                    ].map((stat) => (
                        <Card key={stat.label} style={{ flex: 1, minWidth: "160px", padding: "16px 20px" }}>
                            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {stat.label}
                            </div>
                            <div style={{ fontSize: "22px", fontWeight: "700", color: stat.color, marginTop: "6px" }}>
                                {stat.value}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Transactions table */}
            <Card style={{ padding: "0px" }}>
                {loadingTx ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading results...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        No payroll results yet. Select a cycle and click <strong>Run Calculation</strong>.
                    </div>
                ) : (
                    <Table columns={columns} data={transactions} defaultSort={{ key: "net_pay", order: "desc" }} />
                )}
            </Card>
        </>
    );
};

export default RunPayrollPage;
