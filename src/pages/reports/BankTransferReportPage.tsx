import { useState } from "react";
import { createPortal } from "react-dom";
import useClosedCycleReport from "./shared/useClosedCycleReport";
import useA4Preview, { printElement } from "./shared/useA4Preview";
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

/* ── CSV export helper ──────────────────────────────────────────────────── */
const exportCSV = (rows, company, cycle) => {
    if (!rows?.length) return;
    const header = ["No", "Companies", "Employee Code", "Employee Name", "Bank", "Account No", "Account Name", "Net Pay (THB)"];
    const lines = rows.map((r, i) => [
        i + 1,
        r.companies_name,
        r.employees_code,
        `${r.first_name} ${r.last_name}`,
        r.bank_name || "(no account)",
        r.account_no || "",
        r.account_name || "",
        r.net_pay.toFixed(2),
    ]);
    const csv = [header, ...lines]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BankTransfer_${company?.name || "Company"}_${cycle?.cycle_name || ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

/* ── A4 Summary PDF Print ───────────────────────────────────────────────── */
const A4BankSummary = ({ data }) => {
    if (!data) return null;
    const { cycle, company, rows = [], total_net_pay } = data;

    const summaryColumns = [
        { label: "#", render: (r, i) => i + 1 },
        { label: "Companies", render: (r) => r.companies_name },
        { label: "Code", render: (r) => r.employees_code },
        { label: "Employee Name", render: (r) => `${r.first_name} ${r.last_name}` },
        { label: "Bank", render: (r) => r.bank_name || "—" },
        { label: "Account No", render: (r) => <span className="font-mono">{r.account_no || "—"}</span> },
        {
            label: "Net Pay",
            render: (r) => (
                <span className="font-mono font-semibold text-main">
                    ฿{fc(r.net_pay)}
                </span>
            ),
        },
    ];

    return (
        <div
            id="bank-summary-a4"
            className="w-[210mm] min-h-[297mm] bg-[#fff] p-[16mm_14mm] font-[Segoe_UI,Arial,sans-serif] text-[13px] text-strong box-border"
        >
            {/* Header */}
            <div className="flex justify-between items-start pb-[14px] mb-[14px] border-b-[3px] border-b-main">
                <div>
                    <div className="text-[22px] font-extrabold text-main">{company?.name || "—"}</div>
                    {company?.address && <div className="text-muted text-[12px] mt-[4px]">{company.address}</div>}
                    {company?.tax_id && <div className="text-muted text-[12px]">Tax ID: {company.tax_id}</div>}
                </div>
                <div className="text-right">
                    <div className="text-[22px] font-black tracking-[2px] text-main uppercase">BANK TRANSFER</div>
                    <div className="text-muted text-[12px] mt-[6px]">{cycle?.cycle_name}</div>
                    <div className="text-muted text-[12px]">{fd(cycle?.start_date)} — {fd(cycle?.end_date)}</div>
                </div>
            </div>
            {/* Table */}
            <Table columns={summaryColumns} data={rows} enableSearch={false} sortable={false} fitWidth />
            <div className="grid grid-cols-[1fr_auto] bg-main text-[#fff] p-[10px]">
                <div className="font-extrabold text-[13px]">Total Net Pay</div>
                <div className="text-right font-mono font-black text-[15px]">
                    ฿{fc(total_net_pay)}
                </div>
            </div>
            <div className="mt-[40px] text-center text-[10px] text-subtle">
                Bank Transfer Summary — {company?.name} — {cycle?.cycle_name} — Records are immutable once the cycle is closed.
            </div>
        </div>
    );
};

// Page component
const BankTransferReportPage = () => {
    const { cycles, selectedCycleId, setSelectedCycleId, data, loadingCycles, loadingData } =
        useClosedCycleReport((cycleId) => `/reports/bank-transfer/${cycleId}`);
    const [isPrintOpen, setIsPrintOpen] = useState(false);

    useA4Preview(isPrintOpen, () => setIsPrintOpen(false));

    const handlePrint = () => printElement("bank-summary-a4");

    const columns = [
        {
            label: "Employee",
            render: (r) => (
                <div>
                    <div className="font-semibold text-main">{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] text-subtle mt-[2px]">{r.employees_code}</div>
                </div>
            ),
        },
        { label: "Bank", render: (r) => r.bank_name || <span className="text-accent">Not Set</span> },
        { label: "Account No", render: (r) => <span className="font-mono">{r.account_no || "—"}</span> },
        { label: "Account Name", render: (r) => r.account_name || "—" },
        {
            label: "Net Pay",
            render: (r) => (
                <span className="font-mono font-bold text-main">฿{fc(r.net_pay)}</span>
            ),
        },
        { label: "Companies", render: (r) => r.companies_name || "—" },
        {
            label: "",
            render: () => null,
        },
    ];

    const cycle = data?.cycle;
    const rows = data?.rows || [];
    const printPreview = isPrintOpen ? (
        <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-main z-[10000] overflow-y-auto">
            <div id="print-toolbar" className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <span className="text-[#fff] font-bold text-[15px]">Bank Transfer Summary Preview</span>
                <div className="flex gap-[10px]">
                    <button onClick={handlePrint} className="bg-success text-[#fff] border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px]">Print / Save PDF</button>
                    <button onClick={() => setIsPrintOpen(false)} className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]">Close</button>
                </div>
            </div>
            <div className="flex justify-center p-[32px_24px_48px]">
                <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                    <A4BankSummary data={data} />
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <PageHeader title="Bank Transfer" />

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
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            containerStyle={{ marginBottom: 0 }}
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

            {/* Actions */}
            {data && rows.length > 0 && (
                <div className="flex gap-[10px] mb-[16px]">
                    <Button variant="primary" onClick={() => exportCSV(rows, data.company, cycle)} className="w-auto px-[18px] py-[9px]">
                        Export CSV (iBusiness)
                    </Button>
                    <Button variant="primary" onClick={() => setIsPrintOpen(true)} className="w-auto px-[18px] py-[9px]">
                        Print Summary PDF
                    </Button>
                </div>
            )}

            {/* Table */}
            <Card className="p-0">
                {loadingData ? (
                    <div className="p-[40px] text-center text-subtle">Loading...</div>
                ) : rows.length === 0 ? (
                    <div className="p-[40px] text-center text-subtle">
                        {selectedCycleId ? "No payroll records found for this cycle." : "Select a closed cycle above."}
                    </div>
                ) : (
                    <>
                        <Table columns={columns} data={rows} />
                        <div className="p-[14px_20px] border-t border-t-line-muted flex justify-end gap-[32px] text-[13px] bg-surface">
                            <span className="text-muted">Total Employees: <strong>{rows.length}</strong></span>
                            <span className="text-main font-extrabold text-[15px] font-mono">
                                Total Net Pay: ฿{fc(data?.total_net_pay)}
                            </span>
                        </div>
                    </>
                )}
            </Card>
            {printPreview && createPortal(printPreview, document.body)}
        </>
    );
};

export default BankTransferReportPage;
