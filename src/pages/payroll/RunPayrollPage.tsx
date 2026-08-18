import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import SelectField from "../../components/common/SelectField";
import HelpIcon from "../../components/common/HelpIcon";
import MasterDataWarning from "../../components/common/MasterDataWarning";
import DetailDropdown from "../../components/common/DetailDropdown";
import { useAuth } from "../../hooks/useAuth";
import useRunPayroll from "./run-payroll/useRunPayroll";
import CycleDiffCard from "./run-payroll/CycleDiffCard";
import PreCheckPanel from "./run-payroll/PreCheckPanel";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RunPayrollPage = () => {
    const { homeCompanyId } = useAuth();
    const {
        companies, cycles: filteredCycles, transactions, payrollConfig,
        selectedCompanyId, selectedCycleId, selectedCycle, selectCycle, changeCompany, dismissPreCheck,
        loadingCycles, loadingTx, loadingConfig, calculating,
        calcResult, diffData, preCheckIssues, pendingCalculate,
        calculate, runCalculate,
    } = useRunPayroll(homeCompanyId);

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
            label: "Taxable Income",
            sortKey: "taxable_income",
            sortValue: (row) => row.taxable_income || 0,
            render: (row) => (
                <DetailDropdown
                    total={row.taxable_income}
                    details={row.details || []}
                    color="#475569"
                    filterFn={(d) =>
                        (d.type === "earning" || d.type === "deduction") &&
                        d.item_name !== "Base Salary" &&
                        d.item_name !== "Income Tax"
                    }
                    itemColorFn={(d) => (d.is_tax_relevant ? (d.type === "earning" ? "#10b981" : "#ef4444") : "#94a3b8")}
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
                    <div style={{ flex: 2, minWidth: "220px" }}>
                        <SelectField
                            label="Company"
                            options={companies.map((c) => ({ id: c.id, name: c.name }))}
                            value={selectedCompanyId}
                            onChange={(e) => changeCompany(e.target.value)}
                            containerStyle={{ marginBottom: 0 }}
                        />
                    </div>

                    <div style={{ flex: 3, minWidth: "220px" }}>
                        {loadingCycles ? (
                            <div style={{ color: "#94a3b8", fontSize: "14px" }}>Loading cycles...</div>
                        ) : filteredCycles.length === 0 ? (
                            <div style={{ color: "#94a3b8", fontSize: "14px" }}>No open cycles available.</div>
                        ) : (
                            <SelectField
                                label="Select Open Cycle"
                                options={filteredCycles.map((c) => {
                                    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
                                    const dateRange = (c.start_date && c.end_date) ? ` · ${fmt(c.start_date)} – ${fmt(c.end_date)}` : "";
                                    return { id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}${dateRange}` };
                                })}
                                value={selectedCycleId}
                                onChange={(e) => selectCycle(e.target.value)}
                                containerStyle={{ marginBottom: 0 }}
                            />
                        )}
                    </div>

                    <Button
                        onClick={calculate}
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
                                { label: "Tax Method", value: { Progressive: "Thai Progressive Rate", None: "No Tax" }[payrollConfig.tax_calculation] || payrollConfig.tax_calculation || "Thai Progressive Rate" },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px" }}>{item.label}</div>
                                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <PreCheckPanel
                    issues={preCheckIssues}
                    pendingCalculate={pendingCalculate}
                    onProceed={runCalculate}
                    onDismiss={dismissPreCheck}
                />

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

                {/* Informational, not a warning: new hires pro-rated because they started mid-cycle. */}
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

            <CycleDiffCard diffData={diffData} />

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
