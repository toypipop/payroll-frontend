import { logApiFailure } from "../../utils/apiDiagnostic";
import { usePagedResource } from "../../hooks/usePagedResource";
import type { PayrollTransactionsResponse } from "../../types/api";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axiosInstance";
import useA4Preview, { printElement } from "./shared/useA4Preview";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";
import { apiErrorMessage } from "../../utils/apiError";
import { TONE_TEXT_STRONG } from "../../components/common/tone";
import { payrollDetailTone } from "../payroll/payrollDetailTone";
import type { PayslipReport, ReportCompany } from "../../types/reports";
import type { ApiId, PayrollCycle, PayrollTransaction, PayrollTransactionDetail, TableColumn } from "../../types/api";

const formatCurrency = (val: number | string | null | undefined) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: number | string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
};

// A4 payslip document
const A4Payslip = ({ slip, cycle, company }: { slip: PayrollTransaction | null; cycle: PayrollCycle | null; company: ReportCompany | null }) => {
    if (!slip) return null;

    const earnings = slip.details?.filter((d) => d.type === "earning") || [];
    const deductions = slip.details?.filter((d) => d.type === "deduction") || [];
    const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);

    const earningsColumns: TableColumn<PayrollTransactionDetail>[] = [
        {
            label: "Earning",
            render: (item) => item.item_name,
        },
        {
            label: "Amount",
            render: (item) => (
                <span className="font-mono text-success-text font-semibold">
                    {formatCurrency(item.amount)}
                </span>
            ),
        },
    ];

    const deductionsColumns: TableColumn<PayrollTransactionDetail>[] = [
        {
            label: "Deduction",
            render: (item) => <span className="text-main">{item.item_name}</span>,
        },
        {
            label: "Amount",
            render: (item) => (
                <span className={`font-mono font-semibold ${TONE_TEXT_STRONG[payrollDetailTone(item)]}`}>
                    ({formatCurrency(item.amount)})
                </span>
            ),
        },
    ];

    return (
        <div id="payslip-a4" className="w-[210mm] min-h-[297mm] bg-white p-[16mm_14mm] font-[Segoe_UI,Arial,sans-serif] text-[13px] text-strong box-border">
            {/* Company Header */}
            <div className="flex justify-between items-start pb-[14px] mb-[14px] border-b-[3px] border-b-main">
                <div>
                    <div className="text-[22px] font-extrabold text-main leading-[1.2]">
                        {company?.name || "—"}
                    </div>
                    {company?.address && (
                        <div className="text-muted text-[12px] mt-[4px]">{company.address}</div>
                    )}
                    {company?.phone && (
                        <div className="text-muted text-[12px]">Tel: {company.phone}</div>
                    )}
                    {company?.tax_id && (
                        <div className="text-muted text-[12px]">Tax ID: {company.tax_id}</div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-[24px] font-black tracking-[3px] text-main uppercase">
                        PAYSLIP
                    </div>
                    <div className="text-muted text-[12px] mt-[6px]">
                        {cycle?.cycle_name}
                    </div>
                    <div className="text-muted text-[12px]">
                        {formatDate(cycle?.start_date)} — {formatDate(cycle?.end_date)}
                    </div>
                    <div className="mt-[6px] inline-block bg-hover rounded-[4px] p-[2px_10px] text-[11px] text-muted font-semibold">
                        CLOSED / LOCKED
                    </div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-[0] bg-surface border border-line-muted rounded-[6px] mb-[18px] overflow-hidden">
                {[
                    ["Employee Name", `${slip.employees?.first_name || ""} ${slip.employees?.last_name || ""}`],
                    ["Employee Code", slip.employees?.employees_code || "—"],
                    ["Department", slip.employees?.department?.dept_name || "—"],
                    ["Position", slip.employees?.position?.pos_name || "—"],
                    ["Base Salary", `—${formatCurrency(slip.salaries_at_time)}`],
                    ["Pay Period", `${formatDate(cycle?.start_date)} — ${formatDate(cycle?.end_date)}`],
                ].map(([label, value], i) => (
                    <div
                        key={i}
                        className={`px-3.5 py-2.5 ${i % 3 !== 2 ? "border-r border-r-line-muted" : ""} ${i < 3 ? "border-b border-b-line-muted" : ""}`}
                    >
                        <div className="text-[10px] font-bold text-subtle uppercase tracking-[0.06em]">
                            {label}
                        </div>
                        <div className="font-semibold text-[13px] mt-[3px] text-main">
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Earnings & Deductions Side-by-Side */}
            <div className="grid grid-cols-[1fr_1fr] gap-[16px] mb-[18px]">
                {/* Earnings */}
                <div className="border border-line-muted rounded-[6px] overflow-hidden">
                    <div className="bg-success-text text-white p-[9px_14px] font-bold text-[11px] uppercase tracking-[1px]">
                        Earnings
                    </div>
                    <Table columns={earningsColumns} data={earnings} enableSearch={false} sortable={false} fitWidth />
                    <div className="grid grid-cols-[1fr_auto] p-[9px_14px] bg-success-soft font-extrabold text-[13px]">
                        <div>Total Earnings</div>
                        <div className="font-mono text-[14px] text-success-text">
                            {formatCurrency(slip.total_earning)}
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div className="border border-line-muted rounded-[6px] overflow-hidden">
                    <div className="bg-danger-text text-white p-[9px_14px] font-bold text-[11px] uppercase tracking-[1px]">
                        Deductions
                    </div>
                    <Table columns={deductionsColumns} data={deductions} enableSearch={false} sortable={false} fitWidth />
                    <div className="grid grid-cols-[1fr_auto] p-[9px_14px] bg-danger-soft font-extrabold text-[13px]">
                        <div>Total Deductions</div>
                        <div className="font-mono text-[14px] text-danger-text">
                            ({formatCurrency(totalDeductions)})
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-main text-white rounded-[8px] p-[18px_22px] flex justify-between items-center">
                <div>
                    <div className="text-[11px] text-subtle uppercase tracking-[1px] font-semibold">
                        Net Pay
                    </div>
                    <div className="text-[28px] font-black font-mono mt-[4px]">
                        —{formatCurrency(slip.net_pay)}
                    </div>
                </div>
                <div className="text-right text-[12px] text-subtle leading-[1.8]">
                    <div>Gross Earnings &nbsp;&nbsp; —{formatCurrency(slip.total_earning)}</div>
                    <div>Total Deductions &nbsp; (—{formatCurrency(totalDeductions)})</div>
                </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-[24px] mt-[36px] pt-[16px] border-t border-t-line-muted">
                {["Employee", "HR / Payroll Officer", "Authorised By"].map((label) => (
                    <div key={label} className="text-center">
                        <div className="h-[40px] border-b border-b-secondary" />
                        <div className="text-[11px] text-muted mt-[6px]">{label}</div>
                    </div>
                ))}
            </div>
            {/* Footer note */}
            <div className="mt-[16px] text-center text-[10px] text-subtle">
                This payslip is computer-generated. Payroll cycle: {cycle?.cycle_name} — Records are immutable once the cycle is closed.
            </div>
        </div>
    );
};

const PayslipsReportPage = () => {
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const { data: transactionPage, table } = usePagedResource<PayrollTransactionsResponse>(selectedCycleId ? `/reports/payslips/transactions/${selectedCycleId}` : null);
    const selectedCycle = transactionPage?.cycle;
    const transactions = transactionPage?.transactions ?? [];
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [slip, setSlip] = useState<PayslipReport | null>(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);
    const [loadingSlip, setLoadingSlip] = useState(false);

    const fetchCycles = async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get("/payroll/cycles/options");
            const closed = ((res.data || []) as PayrollCycle[]).filter((c) => c.is_closed);
            setCycles(closed);
            if (closed.length > 0) setSelectedCycleId(String(closed[0].id));
        } catch (err) {
            logApiFailure("payslips.load", err);
        } finally {
            setLoadingCycles(false);
        }
    };

    useEffect(() => { fetchCycles(); }, []);

    useA4Preview(isSlipOpen, () => {
        setIsSlipOpen(false);
        setSlip(null);
    });

    const handleViewSlip = async (transactionId?: ApiId) => {
        try {
            setLoadingSlip(true);
            setIsSlipOpen(true);
            setSlip(null);
            const res = await api.get(`/payslips/${transactionId}`);
            setSlip(res.data);
        } catch (err) {
            alert(apiErrorMessage(err, "Failed to load payslip"));
            setIsSlipOpen(false);
        } finally {
            setLoadingSlip(false);
        }
    };

    const handleCloseSlip = () => {
        setIsSlipOpen(false);
        setSlip(null);
    };

    const handlePrint = () => printElement("payslip-a4");

    const slipData = slip?.slip;
    const cycleData = slip?.cycle;
    const companyData = slip?.company;

    const columns: TableColumn<PayrollTransaction>[] = [
        {
            label: "Employee",
            sortKey: "employee_name",
            render: (row) => (
                <div>
                    <div className="font-semibold text-strong">
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div className="text-[11px] text-subtle mt-[2px]">
                        {row.employees?.employees_code}
                    </div>
                </div>
            ),
        },
        {

            label: "Department",
            sortKey: "department",
            render: (row) => (
                <span className="text-[13px]">{row.department_name || "—"}</span>
            ),
        },
        {
            label: "Position",
            sortKey: "position",
            render: (row) => (
                <span className="text-[13px]">{row.position_name || "—"}</span>
            ),
        },
        {
            label: "Gross Earnings",
            sortKey: "total_earning",
            render: (row) => (
                <span className="font-mono text-success-text font-semibold">
                    —{formatCurrency(row.total_earning)}
                </span>
            ),
        },
        {
            label: "Net Pay",
            sortKey: "net_pay",
            render: (row) => (
                <span className="font-mono font-bold text-main text-[14px]">
                    —{formatCurrency(row.net_pay)}
                </span>
            ),
        },
        {
            label: "Companies",
            sortKey: "companies_name",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "",
            render: (row) => (
                <Button
                    variant="ghost"
                    onClick={() => handleViewSlip(row.id)}
                    className="w-auto px-3.5 py-1.5 text-xs"
                >
                    View / Print Slip
                </Button>
            ),
        },
    ];

    const payslipPreview = isSlipOpen ? (
        <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-main z-[10000] overflow-y-auto">
            {/* Toolbar — hidden on print */}
            <div id="payslip-toolbar" className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <div>
                    <span className="text-white font-bold text-[15px]">
                        Payslip Preview
                    </span>
                    {slipData && (
                        <span className="text-subtle text-[13px] ml-[12px]">
                            {slipData.employees?.first_name} {slipData.employees?.last_name} &nbsp;&middot;&nbsp; {cycleData?.cycle_name}
                        </span>
                    )}
                </div>
                <div className="flex gap-[10px]">
                    {slipData && (
                        <button
                            onClick={handlePrint}
                            className="bg-success text-white border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px] flex items-center gap-[6px]"
                        >
                            Print / Save PDF
                        </button>
                    )}
                    <button
                        onClick={handleCloseSlip}
                        className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* A4 slip content */}
            <div className="flex justify-center p-[32px_24px_48px]">
                {loadingSlip ? (
                    <div className="text-subtle text-[14px] pt-[60px]">
                        Loading payslip...
                    </div>
                ) : slipData ? (
                    <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                        <A4Payslip slip={slipData} cycle={cycleData ?? null} company={companyData ?? null} />
                    </div>
                ) : null}
            </div>
        </div>
    ) : null;
    return (
        <>
            <PageHeader title="Payslips" />

            {/* Cycle selector */}
            <Card className="mb-5">
                {loadingCycles ? (
                    <div className="text-subtle text-[14px]">Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div className="text-subtle text-[14px]">
                        No closed cycles available. Close a payroll cycle to access payslips.
                    </div>
                ) : (
                    <>
                        <SelectField
                            label="Select Closed Payroll Cycle"
                            options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            containerClassName="mb-0"
                        />
                        {selectedCycle && (
                            <div className="mt-[10px] text-[13px] text-muted flex items-center gap-[10px]">
                                Period: <strong>{formatDate(selectedCycle.start_date)}</strong> —&nbsp;
                                <strong>{formatDate(selectedCycle.end_date)}</strong>
                                <Badge status="cancelled">Closed / Locked</Badge>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Transactions table */}
            <Card className="p-0">
                <Table columns={columns} data={transactions} server={table} emptyMessage={selectedCycleId ? "No matching payroll records." : "Select a closed cycle above to view payslips."} />
            </Card>

            {payslipPreview && createPortal(payslipPreview, document.body)}
        </>
    );
};

export default PayslipsReportPage;
