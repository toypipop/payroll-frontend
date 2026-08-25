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
import type { SSOReport, SSORow } from "../../types/reports";
import type { TableColumn } from "../../types/api";

const fc = (v: number | string | null | undefined) =>
    Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fd = (d: number | string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
};

/* ── A4 SSO 1-10 Document ───────────────────────────────────────────────── */
const A4SSO = ({ data }: { data: SSOReport | null }) => {
    if (!data) return null;
    const { cycle, company, rows = [], sso_rate, sso_max, total_employee_sso, total_employer_sso, total_sso_combined } = data;

    const printColumns: TableColumn<SSORow>[] = [
        { label: "#", render: (r, i) => i + 1 },
        { label: "Companies", render: (r) => r.companies_name },
        { label: "Code", render: (r) => r.employees_code },
        { label: "Employee Name", render: (r) => `${r.first_name} ${r.last_name}` },
        {
            label: "Wages (Base)",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace" },
            render: (r) => `฿${fc(r.wages)}`,
        },
        {
            label: "Employee SSO",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace", color: "var(--primary-color)", fontWeight: "600" },
            render: (r) => fc(r.employee_sso),
        },
        {
            label: "Employer SSO",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace", color: "var(--primary-color)", fontWeight: "600" },
            render: (r) => fc(r.employer_sso),
        },
        {
            label: "Total",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace", fontWeight: "700" },
            render: (r) => fc(r.employee_sso + r.employer_sso),
        },
    ];

    return (
        <div
            id="sso-a4"
            className="w-[210mm] min-h-[297mm] bg-white p-[16mm_14mm] font-[Segoe_UI,Arial,sans-serif] text-[13px] text-strong box-border"
        >
            {/* Header */}
            <div className="text-center mb-[18px] pb-[14px] border-b-[3px] border-b-main">
                <div className="text-[11px] font-bold text-muted uppercase tracking-[2px]">แบบ สปส.1-10 / SSO Form 1-10 — Monthly Social Security Contribution</div>
                <div className="text-[22px] font-black text-main mt-[6px]">{company?.name || "—"}</div>
                <div className="text-[12px] text-muted mt-[4px]">Tax ID: {company?.tax_id || "—"} &nbsp;|&nbsp; {company?.address || ""}</div>
                <div className="text-[12px] text-muted mt-[2px]">
                    Pay Period: {fd(cycle?.start_date)} — {fd(cycle?.end_date)} &nbsp;|&nbsp; SSO Rate: {sso_rate}% (Max ฿{fc(sso_max)}/month)
                </div>
            </div>
            {/* Table */}
            <Table
                columns={printColumns}
                data={rows}
                density="compact"
                enableSearch={false}
                sortable={false}
                fitWidth
                renderAfterRow={(row, rowIndex, allRows) => {
                    if (rowIndex !== allRows.length - 1) return null;
                    return (
                        <tr className="bg-main text-white font-extrabold">
                            <td colSpan={5} className="p-[10px_10px]">Total</td>
                            <td className="p-[10px_10px] text-right font-mono">{fc(total_employee_sso)}</td>
                            <td className="p-[10px_10px] text-right font-mono">{fc(total_employer_sso)}</td>
                            <td className="p-[10px_10px] text-right font-mono">{fc(total_sso_combined)}</td>
                        </tr>
                    );
                }}
            />
            <div className="grid grid-cols-[1fr_1fr] gap-[40px] mt-[40px] pt-[16px] border-t border-t-line-muted">
                {["HR / Payroll Officer", "Authorised Signatory"].map((l) => (
                    <div key={l} className="text-center">
                        <div className="h-[40px] border-b border-b-secondary" />
                        <div className="text-[11px] text-muted mt-[6px]">{l}</div>
                    </div>
                ))}
            </div>
            <div className="mt-[16px] text-center text-[10px] text-subtle">
                SSO Form 1-10 — {company?.name} — {cycle?.cycle_name} — Computer generated, immutable record.
            </div>
        </div>
    );
};

/* ── E-Filing Text Export ───────────────────────────────────────────────── */
const exportEFiling = (data: SSOReport | null) => {
    if (!data?.rows?.length) return;
    const { company, cycle, rows } = data;
    // Fixed-width text format (common SSO e-filing layout)
    const pad = (s: string | number, n: number) => String(s || "").padEnd(n).slice(0, n);
    const padL = (s: string | number, n: number) => String(s || "").padStart(n).slice(-n);

    const lines = rows.map((r, i) =>
        [
            pad(i + 1, 5),
            pad(r.employees_code ?? "", 15),
            pad(`${r.first_name} ${r.last_name}`, 40),
            padL(Math.round(r.wages * 100), 12),
            padL(Math.round(r.employee_sso * 100), 10),
            padL(Math.round(r.employer_sso * 100), 10),
        ].join("")
    );

    const header = [
        pad("SSO E-FILING", 80),
        pad(`COMPANY: ${company?.name}`, 80),
        pad(`TAX ID: ${company?.tax_id}`, 80),
        pad(`PERIOD: ${cycle?.cycle_name}`, 80),
        pad("", 80),
        pad("SEQ  EMP_CODE        EMPLOYEE_NAME                           WAGES        EMP_SSO   EMPR_SSO", 80),
    ].join("\r\n");

    const content = [header, ...lines].join("\r\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SSO_EFiling_${company?.name || "Company"}_${cycle?.cycle_name || ""}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

// Page component
const SSOReportPage = () => {
    const { cycles, selectedCycleId, setSelectedCycleId, data, loadingCycles, loadingData } =
        useClosedCycleReport<SSOReport>((cycleId) => `/reports/sso/${cycleId}`);
    const [isPrintOpen, setIsPrintOpen] = useState(false);

    useA4Preview(isPrintOpen, () => setIsPrintOpen(false));

    const handlePrint = () => printElement("sso-a4");

    const cycle = data?.cycle;
    const rows = data?.rows || [];

    const columns: TableColumn<SSORow>[] = [
        {
            label: "Employee",
            render: (r) => (
                <div>
                    <div className="font-semibold text-main">{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] text-subtle mt-[2px]">{r.employees_code}</div>
                </div>
            ),
        },
        { label: "Wages (Base)", render: (r) => <span className="font-mono">฿{fc(r.wages)}</span> },
        {
            label: "Employee SSO",
            render: (r) => <span className="font-mono text-primary font-semibold">{fc(r.employee_sso)}</span>,
        },
        {
            label: "Employer SSO",
            render: (r) => <span className="font-mono text-primary font-semibold">{fc(r.employer_sso)}</span>,
        },
        {
            label: "Total SSO",
            render: (r) => <span className="font-mono font-bold">{fc(r.employee_sso + r.employer_sso)}</span>,
        },
        { label: "Companies", render: (r) => r.companies_name || "—" },
    ];

    const printPreview = isPrintOpen ? (
        <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-main z-[10000] overflow-y-auto">
            <div className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <span className="text-white font-bold text-[15px]">SSO Form 1-10 Preview</span>
                <div className="flex gap-[10px]">
                    <button onClick={handlePrint} className="bg-success text-white border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px]">Print / Save PDF</button>
                    <button onClick={() => setIsPrintOpen(false)} className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]">Close</button>
                </div>
            </div>
            <div className="flex justify-center p-[32px_24px_48px]">
                <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                    <A4SSO data={data} />
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <PageHeader title="Social Security (SSO)" />

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
                            containerClassName="mb-0"
                        />
                        {cycle && (
                            <div className="mt-[10px] text-[13px] text-muted flex items-center gap-[10px]">
                                Period: <strong>{fd(cycle.start_date)}</strong> —&nbsp;<strong>{fd(cycle.end_date)}</strong>
                                <Badge status="cancelled">Closed / Locked</Badge>
                                {data?.sso_rate != null && (
                                    <span className="text-[12px] text-body">SSO Rate: <strong>{data.sso_rate}%</strong> (Max ฿{fc(data.sso_max)}/mo)</span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Actions */}
            {data && rows.length > 0 && (
                <div className="flex gap-[10px] mb-[16px]">
                    <Button variant="primary" onClick={() => exportEFiling(data)} className="w-auto px-[18px] py-[9px]">
                        Export E-Filing (.txt)
                    </Button>
                    <Button variant="primary" onClick={() => setIsPrintOpen(true)} className="w-auto px-[18px] py-[9px]">
                        Print SSO 1-10 PDF
                    </Button>
                </div>
            )}

            {/* Table */}
            <Card className="p-0">
                {loadingData ? (
                    <div className="p-[40px] text-center text-subtle">Loading...</div>
                ) : rows.length === 0 ? (
                    <div className="p-[40px] text-center text-subtle">
                        {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                    </div>
                ) : (
                    <>
                        <Table columns={columns} data={rows} />
                        <div className="p-[14px_20px] border-t border-t-line-muted flex justify-end gap-[32px] text-[13px] bg-surface">
                            <span className="text-muted">Employee SSO: <strong className="text-primary font-mono">{fc(data?.total_employee_sso)}</strong></span>
                            <span className="text-muted">Employer SSO: <strong className="text-primary font-mono">{fc(data?.total_employer_sso)}</strong></span>
                            <span className="text-main font-extrabold font-mono">Combined: ฿{fc(data?.total_sso_combined)}</span>
                        </div>
                    </>
                )}
            </Card>
            {printPreview && createPortal(printPreview, document.body)}
        </>
    );
};

export default SSOReportPage;
