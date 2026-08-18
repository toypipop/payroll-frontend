import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import SelectField from "../../components/common/SelectField";
import HelpIcon from "../../components/common/HelpIcon";
import MasterDataWarning from "../../components/common/MasterDataWarning";
import DetailDropdown from "../../components/common/DetailDropdown";
import { TONE_TEXT } from "../../components/common/tone";
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
                    <div className="font-semibold text-strong">
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div className="text-[11px] text-subtle mt-[2px]">
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
                <span className="text-[13px] text-body">
                    {row.employees?.position?.pos_name || "—"}
                </span>
            ),
        },
        {
            label: "Base Salary",
            sortKey: "salaries_at_time",
            sortValue: (row) => row.salaries_at_time || 0,
            render: (row) => (
                <span className="font-mono">฿{formatCurrency(row.salaries_at_time)}</span>
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
                    tone="muted"
                    filterFn={(d) =>
                        (d.type === "earning" || d.type === "deduction") &&
                        d.item_name !== "Base Salary" &&
                        d.item_name !== "Income Tax"
                    }
                    itemToneFn={(d) => (d.is_tax_relevant ? (d.type === "earning" ? "success" : "danger") : "muted")}
                />
            ),
        },
        {
            label: "SSO",
            sortKey: "sso_amount",
            sortValue: (row) => row.sso_amount || 0,
            render: (row) => (
                <span className="font-mono text-accent">
                    ฿{formatCurrency(row.sso_amount)}
                </span>
            ),
        },
        {
            label: "Tax",
            sortKey: "tax_amount",
            sortValue: (row) => row.tax_amount || 0,
            render: (row) => (
                <span className="font-mono text-accent">
                    ฿{formatCurrency(row.tax_amount)}
                </span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            sortValue: (row) => row.net_pay || 0,
            render: (row) => (
                <span className="font-mono font-bold text-[15px] text-main">
                    ฿{formatCurrency(row.net_pay)}
                </span>
            ),
        },
    ];

    const totalNetPay = transactions.reduce((sum, t) => sum + (t.net_pay || 0), 0);
    const totalEarning = transactions.reduce((sum, t) => sum + (t.total_earning || 0), 0);

    return (
        <>
            <PageHeader title={<span className="flex items-center gap-[8px]">Run Payroll<HelpIcon articleId="run-payroll" /></span>} />

            {/* Cycle selector + Run button */}
            <Card className="mb-5">
                <div className="flex items-center gap-[16px] flex-wrap">
                    <div className="flex-[2] min-w-[220px]">
                        <SelectField
                            label="Company"
                            options={companies.map((c) => ({ id: c.id, name: c.name }))}
                            value={selectedCompanyId}
                            onChange={(e) => changeCompany(e.target.value)}
                            containerClassName="mb-0"
                        />
                    </div>

                    <div className="flex-[3] min-w-[220px]">
                        {loadingCycles ? (
                            <div className="text-subtle text-[14px]">Loading cycles...</div>
                        ) : filteredCycles.length === 0 ? (
                            <div className="text-subtle text-[14px]">No open cycles available.</div>
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
                                containerClassName="mb-0"
                            />
                        )}
                    </div>

                    <Button
                        onClick={calculate}
                        disabled={!selectedCycleId || calculating}
                        className="mt-5 w-auto disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {calculating ? "⏳ Calculating..." : "▶ Run Calculation"}
                    </Button>
                </div>

                {/* SSO / Payroll Parameters */}
                {loadingConfig ? (
                    <div className="mt-[16px] text-[13px] text-subtle">
                        Loading parameters...
                    </div>
                ) : !payrollConfig ? (
                    selectedCycle && (
                        <div className="mt-[16px]">
                            <MasterDataWarning
                                message={`No payroll config found for ${selectedCycle.companies?.name || "this company"}. Configure it in Payroll Setup.`}
                                routePath="/payroll-global"
                                moduleKey="PayrollGlobalSettingsPage"
                            />
                        </div>
                    )
                ) : (
                    <div className="mt-[16px] p-[14px_16px] rounded-[10px] bg-surface border border-line-muted">
                        <div className="text-[11px] font-semibold text-subtle uppercase tracking-[0.06em] mb-[12px]">
                            {selectedCycle?.companies?.name || "Company"} · Payroll Parameters
                        </div>
                        <div className="flex gap-[32px] flex-wrap">
                            {[
                                { label: "SSO Rate", value: `${payrollConfig.sso_rate}%` },
                                { label: "SSO Max", value: `฿${formatCurrency(payrollConfig.sso_max_amount)}` },
                                { label: "Min Salary", value: `฿${formatCurrency(payrollConfig.sso_min_salary)}` },
                                { label: "Tax Method", value: { Progressive: "Thai Progressive Rate", None: "No Tax" }[payrollConfig.tax_calculation] || payrollConfig.tax_calculation || "Thai Progressive Rate" },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="text-[11px] text-subtle mb-[3px]">{item.label}</div>
                                    <div className="text-[14px] font-semibold text-strong">{item.value}</div>
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
                    <div className="mt-[12px] p-[10px_14px] rounded-[8px] bg-success-soft border border-success-line text-success-text text-[13px]">
                        <strong>{calcResult.processed_count}</strong> employees processed
                        {calcResult.skipped_count > 0 && (
                            <span className="text-warning-text"> · {calcResult.skipped_count} skipped (no salary record)</span>
                        )}
                        {calcResult.skipped_employees?.length > 0 && (
                            <ul className="m-[6px_0_0_16px] p-[0px] text-[12px] text-warning-text">
                                {calcResult.skipped_employees.map((name: string) => <li key={name}>{name}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* Informational, not a warning: new hires pro-rated because they started mid-cycle. */}
                {calcResult?.prorated_employees?.length > 0 && (
                    <div className="mt-[10px] p-[10px_14px] rounded-[8px] bg-primary-subtle border border-primary text-primary text-[13px]">
                        <strong>{calcResult.prorated_employees.length}</strong> new hire{calcResult.prorated_employees.length > 1 ? "s" : ""} paid pro-rated this cycle (started mid-cycle)
                        <ul className="m-[6px_0_0_16px] p-[0px] text-[12px]">
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
                <div className="flex gap-[16px] mb-[20px] flex-wrap">
                    {[
                        { label: "Employees", value: transactions.length, tone: "brand" as const },
                        { label: "Total Earning", value: `฿${formatCurrency(totalEarning)}`, tone: "success" as const },
                        { label: "Total Net Pay", value: `฿${formatCurrency(totalNetPay)}`, tone: "neutral" as const },
                    ].map((stat) => (
                        <Card key={stat.label} className="flex-1 min-w-[160px] px-5 py-4">
                            <div className="text-[12px] text-subtle font-semibold uppercase tracking-[0.05em]">
                                {stat.label}
                            </div>
                            <div className={`mt-1.5 text-[22px] font-bold ${TONE_TEXT[stat.tone]}`}>
                                {stat.value}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Transactions table */}
            <Card className="p-0">
                {loadingTx ? (
                    <div className="p-[40px] text-center text-subtle">Loading results...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-[40px] text-center text-subtle">
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
