import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
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

/* ── A4 SSO 1-10 Document ───────────────────────────────────────────────── */
const A4SSO = ({ data }) => {
    if (!data) return null;
    const { cycle, company, rows = [], sso_rate, sso_max, total_employee_sso, total_employer_sso, total_sso_combined } = data;

    const printColumns = [
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
            cellStyle: { textAlign: "right", fontFamily: "monospace", color: "#0369a1", fontWeight: "600" },
            render: (r) => fc(r.employee_sso),
        },
        {
            label: "Employer SSO",
            headerStyle: { textAlign: "right" },
            cellStyle: { textAlign: "right", fontFamily: "monospace", color: "#7c3aed", fontWeight: "600" },
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
            style={{
                width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
                padding: "16mm 14mm", fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "13px", color: "#1e293b", boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "18px", paddingBottom: "14px", borderBottom: "3px solid #0f172a" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px" }}>แบบ สปส.1-10 / SSO Form 1-10 — Monthly Social Security Contribution</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginTop: "6px" }}>{company?.name || "—"}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Tax ID: {company?.tax_id || "—"} &nbsp;|&nbsp; {company?.address || ""}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Pay Period: {fd(cycle?.start_date)} — {fd(cycle?.end_date)} &nbsp;|&nbsp; SSO Rate: {sso_rate}% (Max ฿{fc(sso_max)}/month)
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
                        <tr style={{ backgroundColor: "#0f172a", color: "#fff", fontWeight: "800" }}>
                            <td colSpan={5} style={{ padding: "10px 10px" }}>Total</td>
                            <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_employee_sso)}</td>
                            <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_employer_sso)}</td>
                            <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace" }}>{fc(total_sso_combined)}</td>
                        </tr>
                    );
                }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                {["HR / Payroll Officer", "Authorised Signatory"].map((l) => (
                    <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ height: "40px", borderBottom: "1px solid #334155" }} />
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>{l}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
                SSO Form 1-10 — {company?.name} — {cycle?.cycle_name} — Computer generated, immutable record.
            </div>
        </div>
    );
};

/* ── E-Filing Text Export ───────────────────────────────────────────────── */
const exportEFiling = (data) => {
    if (!data?.rows?.length) return;
    const { company, cycle, rows } = data;
    // Fixed-width text format (common SSO e-filing layout)
    const pad = (s, n) => String(s || "").padEnd(n).slice(0, n);
    const padL = (s, n) => String(s || "").padStart(n).slice(-n);

    const lines = rows.map((r, i) =>
        [
            pad(i + 1, 5),
            pad(r.employees_code, 15),
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

/* ── Page Component ─────────────────────────────────────────────────────── */
const SSOReportPage = () => {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [data, setData] = useState(null);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);

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
                setLoadingData(true);
                setData(null);
                const res = await api.get(`/reports/sso/${selectedCycleId}`);
                setData(res.data);
            } catch { setData(null); } finally { setLoadingData(false); }
        })();
    }, [selectedCycleId]);

    const handlePrint = () => {
        const style = document.createElement("style");
        style.innerHTML = `@media print { body * { visibility: hidden !important; } #sso-a4, #sso-a4 * { visibility: visible !important; } #sso-a4 { position: fixed !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; } @page { margin: 0; size: A4; } }`;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    const cycle = data?.cycle;
    const rows = data?.rows || [];

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
        { label: "Wages (Base)", render: (r) => <span style={{ fontFamily: "monospace" }}>฿{fc(r.wages)}</span> },
        {
            label: "Employee SSO",
            render: (r) => <span style={{ fontFamily: "monospace", color: "#0369a1", fontWeight: "600" }}>{fc(r.employee_sso)}</span>,
        },
        {
            label: "Employer SSO",
            render: (r) => <span style={{ fontFamily: "monospace", color: "#7c3aed", fontWeight: "600" }}>{fc(r.employer_sso)}</span>,
        },
        {
            label: "Total SSO",
            render: (r) => <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{fc(r.employee_sso + r.employer_sso)}</span>,
        },
        { label: "Companies", render: (r) => r.companies_name || "—" },
    ];

    return (
        <>
            <PageHeader title="Social Security (SSO)" />

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
                                {data?.sso_rate != null && (
                                    <span style={{ fontSize: "12px", color: "#475569" }}>SSO Rate: <strong>{data.sso_rate}%</strong> (Max ฿{fc(data.sso_max)}/mo)</span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Actions */}
            {data && rows.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <Button variant="primary" onClick={() => exportEFiling(data)} style={{ width: "auto", padding: "9px 18px" }}>
                        Export E-Filing (.txt)
                    </Button>
                    <Button variant="secondary" onClick={() => setIsPrintOpen(true)} style={{ width: "auto", padding: "9px 18px" }}>
                        Print SSO 1-10 PDF
                    </Button>
                </div>
            )}

            {/* Table */}
            <Card style={{ padding: 0 }}>
                {loadingData ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : rows.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        {selectedCycleId ? "No records found for this cycle." : "Select a closed cycle above."}
                    </div>
                ) : (
                    <>
                        <Table columns={columns} data={rows} />
                        <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "32px", fontSize: "13px", background: "#f8fafc" }}>
                            <span style={{ color: "#64748b" }}>Employee SSO: <strong style={{ color: "#0369a1", fontFamily: "monospace" }}>{fc(data?.total_employee_sso)}</strong></span>
                            <span style={{ color: "#64748b" }}>Employer SSO: <strong style={{ color: "#7c3aed", fontFamily: "monospace" }}>{fc(data?.total_employer_sso)}</strong></span>
                            <span style={{ color: "#0f172a", fontWeight: "800", fontFamily: "monospace" }}>Combined: ฿{fc(data?.total_sso_combined)}</span>
                        </div>
                    </>
                )}
            </Card>

            {/* Print overlay */}
            {isPrintOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 3000, overflowY: "auto" }}>
                    <div style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1e293b", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>SSO Form 1-10 Preview</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={handlePrint} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>
                            <button onClick={() => setIsPrintOpen(false)} style={{ backgroundColor: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                        <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                            <A4SSO data={data} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SSOReportPage;
