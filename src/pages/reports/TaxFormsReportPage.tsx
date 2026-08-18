import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axiosInstance";
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
            style={{
                width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
                padding: "16mm 14mm", fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "13px", color: "var(--text-strong)", boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "18px", paddingBottom: "14px", borderBottom: "3px solid var(--text-main)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px" }}>PND.1 — Monthly Withholding Tax Form (Section 50 Bis)</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--text-main)", marginTop: "6px" }}>{company?.name || "—"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Tax ID: {company?.tax_id || "—"} &nbsp;|&nbsp; {company?.address || ""}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Pay Period: {fd(cycle?.start_date)} — {fd(cycle?.end_date)} &nbsp;|&nbsp; Cycle: {cycle?.cycle_name}
                </div>
            </div>
            {/* Table */}
            <Table
                columns={printColumns}
                data={rows}
                density="compact"
                renderAfterRow={(row, rowIndex, allRows) => {
                    if (rowIndex !== allRows.length - 1) return null;
                    return (
                        <tr style={{ backgroundColor: "var(--text-main)", color: "#fff", fontWeight: "800" }}>
                            <td colSpan={4} style={{ padding: "10px 10px" }}>Total</td>
                            <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>฿{fc(total_gross)}</td>
                            <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_sso)}</td>
                            <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_tax)}</td>
                        </tr>
                    );
                }}
            />
            {/* Signature */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "40px", paddingTop: "16px", borderTop: "1px solid var(--border-muted)" }}>
                {["HR / Payroll Officer", "Authorised Signatory"].map((l) => (
                    <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ height: "40px", borderBottom: "1px solid var(--text-secondary)" }} />
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>{l}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "10px", color: "var(--text-subtle)" }}>
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
            style={{
                width: "210mm", minHeight: "148mm", backgroundColor: "#fff",
                padding: "14mm 14mm", fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "13px", color: "var(--text-strong)", boxSizing: "border-box",
                border: "2px dashed var(--border-input)",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700" }}>Withholding Tax Certificate (Form 50 Tawi)</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Withholding Tax Certificate — Form 50 Tawi</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--text-main)", marginTop: "6px" }}>{company?.name || "—"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tax ID: {company?.tax_id || "—"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", border: "1px solid var(--border-muted)", borderRadius: "6px", overflow: "hidden", marginBottom: "14px" }}>
                {[
                    ["Employee Name", `${tx?.employees?.first_name || ""} ${tx?.employees?.last_name || ""}`],
                    ["Employee Code", tx?.employees?.employees_code || "—"],
                    ["Department", tx?.employees?.department?.dept_name || "—"],
                    ["Position", tx?.employees?.position?.pos_name || "—"],
                    ["Pay Period", `${fd(cycle?.start_date)} — ${fd(cycle?.end_date)}`],
                    ["Payroll Cycle", cycle?.cycle_name || "—"],
                ].map(([label, value], i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRight: i % 2 === 0 ? "1px solid var(--border-muted)" : "none", borderBottom: i < 4 ? "1px solid var(--border-muted)" : "none", backgroundColor: "var(--surface-subtle)" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-subtle)", textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontWeight: "600", fontSize: "13px", marginTop: "3px" }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                {[
                    { label: "Gross Income", value: `฿${fc(tx?.total_earning)}`, color: "#059669" },
                    { label: "SSO (Employee)", value: `฿${fc(tx?.sso_amount)}`, color: "var(--accent-color)" },
                    { label: "Tax Withheld", value: `฿${fc(tx?.tax_amount)}`, color: "var(--status-danger-text)" },
                    { label: "Net Pay", value: `฿${fc(tx?.net_pay)}`, color: "var(--text-main)" },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ border: "1px solid var(--border-muted)", borderRadius: "6px", padding: "10px 12px", backgroundColor: "#fff" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-subtle)", textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontFamily: "monospace", fontWeight: "800", fontSize: "15px", color, marginTop: "4px" }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", paddingTop: "12px", borderTop: "1px solid var(--border-muted)" }}>
                {["Employee Signature", "Payer / Authorised Signatory"].map((l) => (
                    <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ height: "36px", borderBottom: "1px solid var(--text-secondary)" }} />
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>{l}</div>
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
                    <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "2px" }}>{r.employees_code}</div>
                </div>
            ),
        },
        {
            label: "Gross Income",
            render: (r) => <span style={{ fontFamily: "monospace", color: "#059669", fontWeight: "600" }}>฿{fc(r.gross_income)}</span>,
        },
        {
            label: "SSO (Employee)",
            render: (r) => <span style={{ fontFamily: "monospace", color: "var(--accent-color)" }}>{fc(r.sso_amount)}</span>,
        },
        {
            label: "Tax Withheld",
            render: (r) => <span style={{ fontFamily: "monospace", color: "var(--status-danger-text)", fontWeight: "600" }}>{fc(r.tax_withheld)}</span>,
        },
        { label: "Companies", render: (r) => r.companies_name || "—" },
        {
            label: "",
            render: (r) => (
                <Button variant="ghost" onClick={() => handleView50Tawi(r.employees_id)} style={{ fontSize: "12px", padding: "6px 12px", width: "auto" }}>
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
                const res = await api.get(`/payroll/transactions/${selectedCycleId}`);
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
                    <Button variant="ghost" onClick={() => handleView50Tawi(txId)} style={{ fontSize: "12px", padding: "6px 12px", width: "auto" }}>
                        50 Tawi
                    </Button>
                );
            },
        },
    ];

    const pnd1Preview = viewMode === "pnd1-print" && pnd1Data ? (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--text-main)", zIndex: 10000, overflowY: "auto" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "var(--text-strong)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>PND.1 Preview — {cycle?.cycle_name}</span>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handlePrint("pnd1-a4")} style={{ backgroundColor: "var(--status-success)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>
                    <button onClick={() => setViewMode("pnd1")} style={{ backgroundColor: "transparent", color: "var(--text-subtle)", border: "1px solid var(--text-secondary)", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                    <A4PND1 data={pnd1Data} />
                </div>
            </div>
        </div>
    ) : null;

    const tawiPreview = viewMode === "tawi" ? (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--text-main)", zIndex: 10000, overflowY: "auto" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "var(--text-strong)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
                    50 Tawi
                    {tawiData && <span style={{ color: "var(--text-subtle)", fontSize: "13px", marginLeft: "12px" }}>{tawiData.transaction?.employees?.first_name} {tawiData.transaction?.employees?.last_name}</span>}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                    {tawiData && <button onClick={() => handlePrint("tawi50-a4")} style={{ backgroundColor: "var(--status-success)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>}
                    <button onClick={() => setViewMode("pnd1")} style={{ backgroundColor: "transparent", color: "var(--text-subtle)", border: "1px solid var(--text-secondary)", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                {loadingTawi ? (
                    <div style={{ color: "var(--text-subtle)", fontSize: "14px", paddingTop: "60px" }}>Loading certificate...</div>
                ) : tawiData ? (
                    <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
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
                            onChange={(e) => setSelectedCycleId(e.target.value)}
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

            {/* Tab buttons */}
            {pnd1Data && pnd1Data.rows?.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <Button
                        variant="primary"
                        onClick={() => setViewMode("pnd1-print")}
                        style={{ width: "auto", padding: "9px 18px" }}
                    >
                        Print PND.1 Form
                    </Button>
                    {viewMode === "tawi" && (
                        <Button variant="ghost" onClick={() => setViewMode("pnd1")} style={{ width: "auto", padding: "9px 18px" }}>
                            ← Back to PND.1
                        </Button>
                    )}
                </div>
            )}

            {/* PND.1 Table */}
            {viewMode === "pnd1" && (
                <Card style={{ padding: 0 }}>
                    {loadingPND1 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>Loading...</div>
                    ) : !pnd1Data || pnd1Data.rows?.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)" }}>
                            {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                        </div>
                    ) : (
                        <>
                            <Table columns={enrichedColumns} data={pnd1Data.rows || []} />
                            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-muted)", display: "flex", justifyContent: "flex-end", gap: "32px", fontSize: "13px", background: "var(--surface-subtle)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Total Gross: <strong style={{ color: "#059669", fontFamily: "monospace" }}>฿{fc(pnd1Data.total_gross)}</strong></span>
                                <span style={{ color: "var(--text-muted)" }}>Total SSO: <strong style={{ color: "var(--accent-color)", fontFamily: "monospace" }}>{fc(pnd1Data.total_sso)}</strong></span>
                                <span style={{ color: "var(--text-muted)" }}>Total Tax: <strong style={{ color: "var(--status-danger-text)", fontFamily: "monospace" }}>{fc(pnd1Data.total_tax)}</strong></span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {renderInlinePreview && viewMode === "pnd1-print" && pnd1Data && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 3000, overflowY: "auto" }}>
                    <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "var(--text-strong)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>PND.1 Preview — {cycle?.cycle_name}</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => handlePrint("pnd1-a4")} style={{ backgroundColor: "var(--status-success)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>
                            <button onClick={() => setViewMode("pnd1")} style={{ backgroundColor: "transparent", color: "var(--text-subtle)", border: "1px solid var(--text-secondary)", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                        <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                            <A4PND1 data={pnd1Data} />
                        </div>
                    </div>
                </div>
            )}

            {renderInlinePreview && viewMode === "tawi" && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 3000, overflowY: "auto" }}>
                    <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "var(--text-strong)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
                            50 Tawi
                            {tawiData && <span style={{ color: "var(--text-subtle)", fontSize: "13px", marginLeft: "12px" }}>{tawiData.transaction?.employees?.first_name} {tawiData.transaction?.employees?.last_name}</span>}
                        </span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {tawiData && <button onClick={() => handlePrint("tawi50-a4")} style={{ backgroundColor: "var(--status-success)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>}
                            <button onClick={() => setViewMode("pnd1")} style={{ backgroundColor: "transparent", color: "var(--text-subtle)", border: "1px solid var(--text-secondary)", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                        {loadingTawi ? (
                            <div style={{ color: "var(--text-subtle)", fontSize: "14px", paddingTop: "60px" }}>Loading certificate...</div>
                        ) : tawiData ? (
                            <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
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
