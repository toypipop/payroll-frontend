import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axiosInstance";
import { TONE_TEXT_STRONG } from "../../components/common/tone";
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
    return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
};

/* ── A4 PND.1 Document ──────────────────────────────────────────────────── */
const A4PND1 = ({ data }) => {
    if (!data) return null;
    const { cycle, company, rows = [], total_gross, total_tax, total_sso } = data;

    const printColumns = [
        { label: "#", render: (r, i) => i + 1 },
        { label: "Companies", render: (r) => r.companies_name },
        { label: "Code", render: (r) => r.employees_code },
        { label: "Employee Name", render: (r) => `${r.first_name} ${r.last_name}` },
        {
            label: "Gross Income",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace" },
            render: (r) => `฿${fc(r.gross_income)}`,
        },
        {
            label: "SSO (Emp)",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace" },
            render: (r) => fc(r.sso_amount),
        },
        {
            label: "Tax Withheld",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace", fontWeight: "600", color: "var(--status-danger-text)" },
            render: (r) => fc(r.tax_withheld),
        },
    ];

    return (
        <div
            id="pnd1-a4"
            className="w-[210mm] min-h-[297mm] bg-white p-[16mm_14mm] font-[Segoe_UI,Arial,sans-serif] text-[13px] text-strong box-border"
        >
            {/* Header */}
            <div className="text-center mb-[18px] pb-[14px] border-b-[3px] border-b-main">
                <div className="text-[11px] font-bold text-muted uppercase tracking-[2px]">PND.1 — Monthly Withholding Tax Form (Section 50 Bis)</div>
                <div className="text-[22px] font-black text-main mt-[6px]">{company?.name || "—"}</div>
                <div className="text-[12px] text-muted mt-[4px]">Tax ID: {company?.tax_id || "—"} &nbsp;|&nbsp; {company?.address || ""}</div>
                <div className="text-[12px] text-muted mt-[2px]">
                    Pay Period: {fd(cycle?.start_date)} — {fd(cycle?.end_date)} &nbsp;|&nbsp; Cycle: {cycle?.cycle_name}
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
                            <td colSpan={4} className="p-[10px_10px]">Total</td>
                            <td className="p-[10px_10px] text-right font-mono">฿{fc(total_gross)}</td>
                            <td className="p-[10px_10px] text-right font-mono">{fc(total_sso)}</td>
                            <td className="p-[10px_10px] text-right font-mono">{fc(total_tax)}</td>
                        </tr>
                    );
                }}
            />
            {/* Signature */}
            <div className="grid grid-cols-[1fr_1fr] gap-[40px] mt-[40px] pt-[16px] border-t border-t-line-muted">
                {["HR / Payroll Officer", "Authorised Signatory"].map((l) => (
                    <div key={l} className="text-center">
                        <div className="h-[40px] border-b border-b-secondary" />
                        <div className="text-[11px] text-muted mt-[6px]">{l}</div>
                    </div>
                ))}
            </div>
            <div className="mt-[16px] text-center text-[10px] text-subtle">
                PND.1 — {company?.name} — {cycle?.cycle_name} — Computer generated, immutable record.
            </div>
        </div>
    );
};

/* ── A4 50 Tawi Certificate ─────────────────────────────────────────────── */
const A4Tawi50 = ({ data }) => {
    if (!data) return null;
    const { cycle, company, transaction: tx } = data;
    return (
        <div
            id="tawi50-a4"
            className="box-border w-[210mm] min-h-[148mm] border-2 border-dashed border-line-input bg-white p-[14mm] font-['Segoe_UI',Arial,sans-serif] text-[13px] text-strong"
        >
            <div className="text-center mb-[14px]">
                <div className="text-[11px] text-muted uppercase tracking-[2px] font-bold">Withholding Tax Certificate (Form 50 Tawi)</div>
                <div className="text-[11px] text-muted uppercase tracking-[1px]">Withholding Tax Certificate — Form 50 Tawi</div>
                <div className="text-[20px] font-black text-main mt-[6px]">{company?.name || "—"}</div>
                <div className="text-[12px] text-muted">Tax ID: {company?.tax_id || "—"}</div>
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-[0] border border-line-muted rounded-[6px] overflow-hidden mb-[14px]">
                {[
                    ["Employee Name", `${tx?.employees?.first_name || ""} ${tx?.employees?.last_name || ""}`],
                    ["Employee Code", tx?.employees?.employees_code || "—"],
                    ["Department", tx?.employees?.department?.dept_name || "—"],
                    ["Position", tx?.employees?.position?.pos_name || "—"],
                    ["Pay Period", `${fd(cycle?.start_date)} — ${fd(cycle?.end_date)}`],
                    ["Payroll Cycle", cycle?.cycle_name || "—"],
                ].map(([label, value], i) => (
                    <div
                        key={i}
                        className={`bg-surface px-3.5 py-2.5 ${i % 2 === 0 ? "border-r border-r-line-muted" : ""} ${i < 4 ? "border-b border-b-line-muted" : ""}`}
                    >
                        <div className="text-[10px] font-bold text-subtle uppercase">{label}</div>
                        <div className="font-semibold text-[13px] mt-[3px]">{value}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-[10px] mb-[14px]">
                {[
                    { label: "Gross Income", value: `฿${fc(tx?.total_earning)}`, tone: "success" as const },
                    { label: "SSO (Employee)", value: `฿${fc(tx?.sso_amount)}`, tone: "accent" as const },
                    { label: "Tax Withheld", value: `฿${fc(tx?.tax_amount)}`, tone: "danger" as const },
                    { label: "Net Pay", value: `฿${fc(tx?.net_pay)}`, tone: "neutral" as const },
                ].map(({ label, value, tone }) => (
                    <div key={label} className="border border-line-muted rounded-[6px] p-[10px_12px] bg-white">
                        <div className="text-[10px] font-bold text-subtle uppercase">{label}</div>
                        <div className={`mt-1 font-mono text-[15px] font-extrabold ${TONE_TEXT_STRONG[tone]}`}>{value}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-[40px] pt-[12px] border-t border-t-line-muted">
                {["Employee Signature", "Payer / Authorised Signatory"].map((l) => (
                    <div key={l} className="text-center">
                        <div className="h-[36px] border-b border-b-secondary" />
                        <div className="text-[11px] text-muted mt-[5px]">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Page component
const TaxFormsReportPage = () => {
    const {
        cycles, selectedCycleId, setSelectedCycleId,
        data: pnd1Data, loadingCycles, loadingData: loadingPND1,
    } = useClosedCycleReport((cycleId) => `/reports/tax-forms/pnd1/${cycleId}`);
    const [tawiData, setTawiData] = useState(null);
    const [loadingTawi, setLoadingTawi] = useState(false);
    const [viewMode, setViewMode] = useState("pnd1"); // "pnd1" | "pnd1-print" | "tawi"

    // A 50 Tawi certificate belongs to one transaction of one cycle, so switching cycles drops it and returns to the PND1 list.
    useEffect(() => {
        setTawiData(null);
        setViewMode("pnd1");
    }, [selectedCycleId]);

    useA4Preview(viewMode === "pnd1-print" || viewMode === "tawi", () => setViewMode("pnd1"));

    const handlePrint = (id) => printElement(id);

    const handleView50Tawi = async (txId) => {
        try {
            setLoadingTawi(true);
            setTawiData(null);
            setViewMode("tawi");
            const res = await api.get(`/reports/tax-forms/50tawi/${txId}`);
            setTawiData(res.data);
        } catch (err) {
            alert(err?.response?.data?.error || "Failed to load 50 Tawi certificate");
            setViewMode("pnd1");
        } finally { setLoadingTawi(false); }
    };

    const cycle = pnd1Data?.cycle;

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
        {
            label: "Gross Income",
            render: (r) => <span className="font-mono text-success-text font-semibold">฿{fc(r.gross_income)}</span>,
        },
        {
            label: "SSO (Employee)",
            render: (r) => <span className="font-mono text-accent">{fc(r.sso_amount)}</span>,
        },
        {
            label: "Tax Withheld",
            render: (r) => <span className="font-mono text-danger-text font-semibold">{fc(r.tax_withheld)}</span>,
        },
        { label: "Companies", render: (r) => r.companies_name || "—" },
        {
            label: "",
            render: (r) => (
                <Button variant="ghost" onClick={() => handleView50Tawi(r.employees_id)} className="text-xs px-3 py-1.5 w-auto">
                    50 Tawi
                </Button>
            ),
        },
    ];

    // PND1 has employees via transaction API returns EmployeesCode not ID Fetch transaction list, store IDs by code
    const [txMap, setTxMap] = useState({}); // employees_code -> tx.id

    useEffect(() => {
        if (!selectedCycleId) return;
        (async () => {
            try {
                const res = await api.get(`/reports/tax-forms/transactions/${selectedCycleId}`);
                const map = {};
                (res.data?.transactions || []).forEach((tx) => {
                    if (tx.employees?.employees_code) {
                        map[tx.employees.employees_code] = tx.id;
                    }
                });
                setTxMap(map);
            } catch { setTxMap({}); }
        })();
    }, [selectedCycleId]);

    const enrichedColumns = [
        ...columns.slice(0, 5),
        {
            label: "",
            render: (r) => {
                const txId = txMap[r.employees_code];
                if (!txId) return null;
                return (
                    <Button variant="ghost" onClick={() => handleView50Tawi(txId)} className="text-xs px-3 py-1.5 w-auto">
                        50 Tawi
                    </Button>
                );
            },
        },
    ];

    const pnd1Preview = viewMode === "pnd1-print" && pnd1Data ? (
        <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-main z-[10000] overflow-y-auto">
            <div className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <span className="text-white font-bold text-[15px]">PND.1 Preview — {cycle?.cycle_name}</span>
                <div className="flex gap-[10px]">
                    <button onClick={() => handlePrint("pnd1-a4")} className="bg-success text-white border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px]">Print / Save PDF</button>
                    <button onClick={() => setViewMode("pnd1")} className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]">Close</button>
                </div>
            </div>
            <div className="flex justify-center p-[32px_24px_48px]">
                <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                    <A4PND1 data={pnd1Data} />
                </div>
            </div>
        </div>
    ) : null;

    const tawiPreview = viewMode === "tawi" ? (
        <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-main z-[10000] overflow-y-auto">
            <div className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <span className="text-white font-bold text-[15px]">
                    50 Tawi
                    {tawiData && <span className="text-subtle text-[13px] ml-[12px]">{tawiData.transaction?.employees?.first_name} {tawiData.transaction?.employees?.last_name}</span>}
                </span>
                <div className="flex gap-[10px]">
                    {tawiData && <button onClick={() => handlePrint("tawi50-a4")} className="bg-success text-white border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px]">Print / Save PDF</button>}
                    <button onClick={() => setViewMode("pnd1")} className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]">Close</button>
                </div>
            </div>
            <div className="flex justify-center p-[32px_24px_48px]">
                {loadingTawi ? (
                    <div className="text-subtle text-[14px] pt-[60px]">Loading certificate...</div>
                ) : tawiData ? (
                    <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                        <A4Tawi50 data={tawiData} />
                    </div>
                ) : null}
            </div>
        </div>
    ) : null;
    const renderInlinePreview = false;

    return (
        <>
            <PageHeader title="Tax Forms" />

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
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Tab buttons */}
            {pnd1Data && pnd1Data.rows?.length > 0 && (
                <div className="flex gap-[10px] mb-[16px]">
                    <Button
                        variant="primary"
                        onClick={() => setViewMode("pnd1-print")}
                        className="w-auto px-[18px] py-[9px]"
                    >
                        Print PND.1 Form
                    </Button>
                    {viewMode === "tawi" && (
                        <Button variant="ghost" onClick={() => setViewMode("pnd1")} className="w-auto px-[18px] py-[9px]">
                            ← Back to PND.1
                        </Button>
                    )}
                </div>
            )}

            {/* PND.1 Table */}
            {viewMode === "pnd1" && (
                <Card className="p-0">
                    {loadingPND1 ? (
                        <div className="p-[40px] text-center text-subtle">Loading...</div>
                    ) : !pnd1Data || pnd1Data.rows?.length === 0 ? (
                        <div className="p-[40px] text-center text-subtle">
                            {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                        </div>
                    ) : (
                        <>
                            <Table columns={enrichedColumns} data={pnd1Data.rows || []} />
                            <div className="p-[14px_20px] border-t border-t-line-muted flex justify-end gap-[32px] text-[13px] bg-surface">
                                <span className="text-muted">Total Gross: <strong className="text-success-text font-mono">฿{fc(pnd1Data.total_gross)}</strong></span>
                                <span className="text-muted">Total SSO: <strong className="text-accent font-mono">{fc(pnd1Data.total_sso)}</strong></span>
                                <span className="text-muted">Total Tax: <strong className="text-danger-text font-mono">{fc(pnd1Data.total_tax)}</strong></span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {renderInlinePreview && viewMode === "pnd1-print" && pnd1Data && (
                <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-[color:rgba(0,0,0,0.75)] z-[3000] overflow-y-auto">
                    <div className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                        <span className="text-white font-bold text-[15px]">PND.1 Preview — {cycle?.cycle_name}</span>
                        <div className="flex gap-[10px]">
                            <button onClick={() => handlePrint("pnd1-a4")} className="bg-success text-white border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px]">Print / Save PDF</button>
                            <button onClick={() => setViewMode("pnd1")} className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]">Close</button>
                        </div>
                    </div>
                    <div className="flex justify-center p-[32px_24px_48px]">
                        <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                            <A4PND1 data={pnd1Data} />
                        </div>
                    </div>
                </div>
            )}

            {renderInlinePreview && viewMode === "tawi" && (
                <div className="fixed top-[0px] left-[0px] right-[0px] bottom-[0px] bg-[color:rgba(0,0,0,0.75)] z-[3000] overflow-y-auto">
                    <div className="sticky top-[0px] z-[1] bg-strong p-[12px_28px] flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                        <span className="text-white font-bold text-[15px]">
                            50 Tawi
                            {tawiData && <span className="text-subtle text-[13px] ml-[12px]">{tawiData.transaction?.employees?.first_name} {tawiData.transaction?.employees?.last_name}</span>}
                        </span>
                        <div className="flex gap-[10px]">
                            {tawiData && <button onClick={() => handlePrint("tawi50-a4")} className="bg-success text-white border-none rounded-[8px] cursor-pointer p-[9px_18px] font-bold text-[13px]">Print / Save PDF</button>}
                            <button onClick={() => setViewMode("pnd1")} className="bg-transparent text-subtle border border-secondary rounded-[8px] cursor-pointer p-[9px_18px] font-semibold text-[13px]">Close</button>
                        </div>
                    </div>
                    <div className="flex justify-center p-[32px_24px_48px]">
                        {loadingTawi ? (
                            <div className="text-subtle text-[14px] pt-[60px]">Loading certificate...</div>
                        ) : tawiData ? (
                            <div className="shadow-[0_4px_32px_rgba(0,0,0,0.4)] rounded-[4px]">
                                <A4Tawi50 data={tawiData} />
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
            {pnd1Preview && createPortal(pnd1Preview, document.body)}
            {tawiPreview && createPortal(tawiPreview, document.body)}
        </>
    );
};

export default TaxFormsReportPage;
