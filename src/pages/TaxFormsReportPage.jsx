import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import SelectField from "../components/common/SelectField";

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
    return (
        <div
            id="pnd1-a4"
            style={{
                width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
                padding: "16mm 14mm", fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "13px", color: "#1e293b", boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "18px", paddingBottom: "14px", borderBottom: "3px solid #0f172a" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px" }}>ภ.ง.ด.1 / PND.1 — Monthly Withholding Tax Form (Section 50 Bis)</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginTop: "6px" }}>{company?.name || "—"}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Tax ID: {company?.tax_id || "—"} &nbsp;|&nbsp; {company?.address || ""}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Pay Period: {fd(cycle?.start_date)} — {fd(cycle?.end_date)} &nbsp;|&nbsp; Cycle: {cycle?.cycle_name}
                </div>
            </div>
            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                    <tr style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                        {["#", "Companies", "Code", "Employee Name", "Gross Income", "SSO (Emp)", "Tax Withheld"].map((h) => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: h.startsWith("Gross") || h.startsWith("SSO") || h.startsWith("Tax") ? "right" : "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "7px 10px" }}>{i + 1}</td>
                            <td style={{ padding: "7px 10px" }}>{r.companies_name}</td>
                            <td style={{ padding: "7px 10px" }}>{r.employees_code}</td>
                            <td style={{ padding: "7px 10px" }}>{r.first_name} {r.last_name}</td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace" }}>฿{fc(r.gross_income)}</td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(r.sso_amount)}</td>
                            <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: "600", color: "#dc2626" }}>{fc(r.tax_withheld)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: "#0f172a", color: "#fff", fontWeight: "800" }}>
                        <td colSpan={4} style={{ padding: "10px 10px" }}>Total</td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>฿{fc(total_gross)}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_sso)}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_tax)}</td>
                    </tr>
                </tfoot>
            </table>
            {/* Signature */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                {["HR / Payroll Officer", "Authorised Signatory"].map((l) => (
                    <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ height: "40px", borderBottom: "1px solid #334155" }} />
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>{l}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
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
                fontSize: "13px", color: "#1e293b", boxSizing: "border-box",
                border: "2px dashed #cbd5e1",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700" }}>หนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ)</div>
                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Withholding Tax Certificate — Form 50 Tawi</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", marginTop: "6px" }}>{company?.name || "—"}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Tax ID: {company?.tax_id || "—"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "14px" }}>
                {[
                    ["Employee Name", `${tx?.employees?.first_name || ""} ${tx?.employees?.last_name || ""}`],
                    ["Employee Code", tx?.employees?.employees_code || "—"],
                    ["Department", tx?.employees?.department?.dept_name || "—"],
                    ["Position", tx?.employees?.position?.pos_name || "—"],
                    ["Pay Period", `${fd(cycle?.start_date)} — ${fd(cycle?.end_date)}`],
                    ["Payroll Cycle", cycle?.cycle_name || "—"],
                ].map(([label, value], i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRight: i % 2 === 0 ? "1px solid #e2e8f0" : "none", borderBottom: i < 4 ? "1px solid #e2e8f0" : "none", backgroundColor: "#f8fafc" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontWeight: "600", fontSize: "13px", marginTop: "3px" }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                {[
                    { label: "Gross Income", value: `฿${fc(tx?.total_earning)}`, color: "#059669" },
                    { label: "SSO (Employee)", value: `฿${fc(tx?.sso_amount)}`, color: "#f59e0b" },
                    { label: "Tax Withheld", value: `฿${fc(tx?.tax_amount)}`, color: "#dc2626" },
                    { label: "Net Pay", value: `฿${fc(tx?.net_pay)}`, color: "#0f172a" },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 12px", backgroundColor: "#fff" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontFamily: "monospace", fontWeight: "800", fontSize: "15px", color, marginTop: "4px" }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                {["Employee Signature", "Payer / Authorised Signatory"].map((l) => (
                    <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ height: "36px", borderBottom: "1px solid #334155" }} />
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "5px" }}>{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── Page Component ─────────────────────────────────────────────────────── */
const TaxFormsReportPage = () => {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [pnd1Data, setPnd1Data] = useState(null);
    const [tawiData, setTawiData] = useState(null);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingPND1, setLoadingPND1] = useState(false);
    const [loadingTawi, setLoadingTawi] = useState(false);
    const [viewMode, setViewMode] = useState("pnd1"); // "pnd1" | "pnd1-print" | "tawi"

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
                setLoadingPND1(true);
                setPnd1Data(null);
                setTawiData(null);
                setViewMode("pnd1");
                const res = await api.get(`/reports/tax-forms/pnd1/${selectedCycleId}`);
                setPnd1Data(res.data);
            } catch { setPnd1Data(null); } finally { setLoadingPND1(false); }
        })();
    }, [selectedCycleId]);

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

    const handlePrint = (id) => {
        const style = document.createElement("style");
        style.innerHTML = `@media print { body * { visibility: hidden !important; } #${id}, #${id} * { visibility: visible !important; } #${id} { position: fixed !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; } @page { margin: 0; size: A4; } }`;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    const cycle = pnd1Data?.cycle;

    const columns = [
        {
            label: "Employee",
            render: (r) => (
                <div>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{r.employees_code}</div>
                </div>
            ),
        },
        {
            label: "Gross Income",
            render: (r) => <span style={{ fontFamily: "monospace", color: "#059669", fontWeight: "600" }}>฿{fc(r.gross_income)}</span>,
        },
        {
            label: "SSO (Employee)",
            render: (r) => <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>{fc(r.sso_amount)}</span>,
        },
        {
            label: "Tax Withheld",
            render: (r) => <span style={{ fontFamily: "monospace", color: "#dc2626", fontWeight: "600" }}>{fc(r.tax_withheld)}</span>,
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

    // The PND1 table has employees_id via the row — but the API returns EmployeesCode not ID.
    // We need to find the transaction ID to fetch 50 Tawi. Enrich rows from pnd1Data:
    // Actually, GetTax50Tawi takes transaction_id, not employees_id.
    // We need to fetch the transaction list too. Let's use a simpler approach:
    // fetch the normal transactions list and store tx IDs keyed by employees_code.
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

    return (
        <>
            <PageHeader title="Tax Forms" />

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

            {/* Tab buttons */}
            {pnd1Data && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <Button
                        variant={viewMode === "pnd1" ? "primary" : "secondary"}
                        onClick={() => setViewMode("pnd1")}
                        style={{ width: "auto", padding: "9px 18px" }}
                    >
                        ภ.ง.ด.1 / PND.1 List
                    </Button>
                    <Button
                        variant="secondary"
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
                        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                    ) : !pnd1Data || pnd1Data.rows?.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                            {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                        </div>
                    ) : (
                        <>
                            <Table columns={enrichedColumns} data={pnd1Data.rows || []} />
                            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "32px", fontSize: "13px", background: "#f8fafc" }}>
                                <span style={{ color: "#64748b" }}>Total Gross: <strong style={{ color: "#059669", fontFamily: "monospace" }}>฿{fc(pnd1Data.total_gross)}</strong></span>
                                <span style={{ color: "#64748b" }}>Total SSO: <strong style={{ color: "#f59e0b", fontFamily: "monospace" }}>{fc(pnd1Data.total_sso)}</strong></span>
                                <span style={{ color: "#64748b" }}>Total Tax: <strong style={{ color: "#dc2626", fontFamily: "monospace" }}>{fc(pnd1Data.total_tax)}</strong></span>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {/* PND.1 Print overlay */}
            {viewMode === "pnd1-print" && pnd1Data && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 3000, overflowY: "auto" }}>
                    <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1e293b", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>PND.1 Preview — {cycle?.cycle_name}</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => handlePrint("pnd1-a4")} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>
                            <button onClick={() => setViewMode("pnd1")} style={{ backgroundColor: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                        <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                            <A4PND1 data={pnd1Data} />
                        </div>
                    </div>
                </div>
            )}

            {/* 50 Tawi overlay */}
            {viewMode === "tawi" && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 3000, overflowY: "auto" }}>
                    <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1e293b", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
                            50 Tawi
                            {tawiData && <span style={{ color: "#94a3b8", fontSize: "13px", marginLeft: "12px" }}>{tawiData.transaction?.employees?.first_name} {tawiData.transaction?.employees?.last_name}</span>}
                        </span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {tawiData && <button onClick={() => handlePrint("tawi50-a4")} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>}
                            <button onClick={() => setViewMode("pnd1")} style={{ backgroundColor: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                        {loadingTawi ? (
                            <div style={{ color: "#94a3b8", fontSize: "14px", paddingTop: "60px" }}>Loading certificate...</div>
                        ) : tawiData ? (
                            <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                                <A4Tawi50 data={tawiData} />
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
};

export default TaxFormsReportPage;
