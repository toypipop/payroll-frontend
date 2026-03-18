import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    const fetchCycles = async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get("/payroll/cycles");
            const open = (res.data || []).filter((c) => !c.is_closed);
            setCycles(open);
            if (open.length > 0) {
                setSelectedCycleId(String(open[0].id));
                setSelectedCycle(open[0]);  // FIX: Store the cycle object
            }
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

    const handleCalculate = async () => {
        if (!selectedCycleId || !selectedCycle) return;
        if (!window.confirm("Run payroll calculation for this cycle? Existing results will be recalculated with current SSO parameters.")) return;
        try {
            setCalculating(true);
            setCalcResult(null);
            setTransactions([]);  // Clear existing data for fresh re-render

            // Refresh config before calculation
            await fetchPayrollConfigForCycle(selectedCycle);

            // Send calculation request
            const res = await api.post(`/payroll/calculate/${selectedCycleId}`);
            setCalcResult(res.data);

            // Fetch transactions and re-render
            // Using new array reference to trigger React re-render
            await fetchTransactions(selectedCycleId);
        } catch (err) {
            alert(err.response?.data?.error || "Calculation failed");
        } finally {
            setCalculating(false);
        }
    };

    const columns = [
        {
            label: "Employee",
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
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Position",
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#475569" }}>
                    {row.employees?.position?.pos_name || "—"}
                </span>
            ),
        },
        {
            label: "Base Salary",
            render: (row) => (
                <span style={{ fontFamily: "monospace" }}>฿{formatCurrency(row.salaries_at_time)}</span>
            ),
        },
        {
            label: "Total Earning",
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#10b981" }}>
                    ฿{formatCurrency(row.total_earning)}
                </span>
            ),
        },
        {
            label: "Deductions",
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#ef4444" }}>
                    ฿{formatCurrency(row.total_deduction)}
                </span>
            ),
        },
        {
            label: "SSO",
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>
                    ฿{formatCurrency(row.sso_amount)}
                </span>
            ),
        },
        {
            label: "Tax",
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>
                    ฿{formatCurrency(row.tax_amount)}
                </span>
            ),
        },
        {
            label: "Net Pay",
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
            <PageHeader title="Run Payroll" />

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
                                options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                                value={selectedCycleId}
                                onChange={(e) => {
                                    const cycleId = e.target.value;
                                    setSelectedCycleId(cycleId);
                                    // FIX: Immediately update selectedCycle object from cycles array
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

                {/* FIX Issue 1: Display Current SSO Parameters - Uses Cycle's Company Config */}
                {loadingConfig ? (
                    <div style={{
                        marginTop: "16px", padding: "12px 14px",
                        borderRadius: "6px", backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db", color: "#6b7280", fontSize: "12px",
                    }}>
                        ⏳ Loading SSO parameters for {selectedCycle?.companies?.name || "selected company"}...
                    </div>
                ) : !selectedCycle ? (
                    <div style={{
                        marginTop: "16px", padding: "12px 14px",
                        borderRadius: "6px", backgroundColor: "#fef3c7",
                        border: "1px solid #f59e0b", color: "#78350f", fontSize: "12px",
                    }}>
                        ℹ️ Select a payroll cycle to view SSO parameters
                    </div>
                ) : !payrollConfig ? (
                    <div style={{
                        marginTop: "16px", padding: "12px 14px",
                        borderRadius: "6px", backgroundColor: "#fee2e2",
                        border: "1px solid #fca5a5", color: "#991b1b", fontSize: "12px",
                    }}>
                        ⚠️ Unable to load SSO configuration for <strong>{selectedCycle?.companies?.name || "this company"}</strong>. Please verify Payroll Setup has been configured.
                    </div>
                ) : payrollConfig ? (
                    <div style={{
                        marginTop: "16px", padding: "12px 14px",
                        borderRadius: "6px", backgroundColor: "#fef3c7",
                        border: "2px solid #f59e0b", color: "#78350f", fontSize: "12px", fontWeight: "600",
                    }}>
                        <div style={{ marginBottom: "8px" }}>
                            📊 <strong>CURRENT SSO PARAMETERS FOR {selectedCycle?.companies?.name?.toUpperCase() || "CYCLE"}</strong>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", fontSize: "11px", fontWeight: "400" }}>
                            <div>Rate: <strong>{payrollConfig.sso_rate}%</strong></div>
                            <div>Max: <strong>฿{formatCurrency(payrollConfig.sso_max_amount)}</strong></div>
                            <div>Min Salary: <strong>฿{formatCurrency(payrollConfig.sso_min_salary)}</strong></div>
                            <div>Tax: <strong>{payrollConfig.tax_calculation || "Progressive"}</strong></div>
                        </div>
                    </div>
                ) : null}

                {/* Calculation result banner */}
                {calcResult && (
                    <div style={{
                        marginTop: "16px", padding: "12px 16px",
                        borderRadius: "8px", backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0", color: "#15803d", fontSize: "14px",
                    }}>
                        ✅ Calculation complete — <strong>{calcResult.processed_count}</strong> employees processed
                        {calcResult.skipped_count > 0 && (
                            <span style={{ color: "#92400e" }}>, {calcResult.skipped_count} skipped (no salary record)</span>
                        )}
                    </div>
                )}
            </Card>

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
                    <Table columns={columns} data={transactions} />
                )}
            </Card>
        </>
    );
};

export default RunPayrollPage;
