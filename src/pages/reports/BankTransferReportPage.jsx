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
        { label: "Account No", render: (r) => <span style={{ fontFamily: "monospace" }}>{r.account_no || "—"}</span> },
        {
            label: "Net Pay",
            render: (r) => (
                <span style={{ fontFamily: "monospace", fontWeight: "600", color: "#0f172a" }}>
                    ฿{fc(r.net_pay)}
                </span>
            ),
        },
    ];

    return (
        <div
            id="bank-summary-a4"
            style={{
                width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
                padding: "16mm 14mm", fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "13px", color: "#1e293b", boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "14px", marginBottom: "14px", borderBottom: "3px solid #0f172a" }}>
                <div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{company?.name || "—"}</div>
                    {company?.address && <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>{company.address}</div>}
                    {company?.tax_id && <div style={{ color: "#64748b", fontSize: "12px" }}>Tax ID: {company.tax_id}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "2px", color: "#0f172a", textTransform: "uppercase" }}>BANK TRANSFER</div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>{cycle?.cycle_name}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{fd(cycle?.start_date)} — {fd(cycle?.end_date)}</div>
                </div>
            </div>
            {/* Table */}
            <Table columns={summaryColumns} data={rows} />
            <div style={{
                display: "grid", gridTemplateColumns: "1fr auto",
                backgroundColor: "#0f172a", color: "#fff",
                padding: "10px",
            }}>
                <div style={{ fontWeight: "800", fontSize: "13px" }}>Total Net Pay</div>
                <div style={{ textAlign: "right", fontFamily: "monospace", fontWeight: "900", fontSize: "15px" }}>
                    ฿{fc(total_net_pay)}
                </div>
            </div>
            <div style={{ marginTop: "40px", textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
                Bank Transfer Summary — {company?.name} — {cycle?.cycle_name} — Records are immutable once the cycle is closed.
            </div>
        </div>
    );
};

/* ── Page Component ─────────────────────────────────────────────────────── */
const BankTransferReportPage = () => {
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
                const res = await api.get(`/reports/bank-transfer/${selectedCycleId}`);
                setData(res.data);
            } catch { setData(null); } finally { setLoadingData(false); }
        })();
    }, [selectedCycleId]);

    const handlePrint = () => {
        const style = document.createElement("style");
        style.innerHTML = `@media print { body * { visibility: hidden !important; } #bank-summary-a4, #bank-summary-a4 * { visibility: visible !important; } #bank-summary-a4 { position: fixed !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; } @page { margin: 0; size: A4; } }`;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

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
        { label: "Bank", render: (r) => r.bank_name || <span style={{ color: "#f59e0b" }}>Not Set</span> },
        { label: "Account No", render: (r) => <span style={{ fontFamily: "monospace" }}>{r.account_no || "—"}</span> },
        { label: "Account Name", render: (r) => r.account_name || "—" },
        {
            label: "Net Pay",
            render: (r) => (
                <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0f172a" }}>฿{fc(r.net_pay)}</span>
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

    return (
        <>
            <PageHeader title="Bank Transfer" />

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

            {/* Actions */}
            {data && rows.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <Button variant="primary" onClick={() => exportCSV(rows, data.company, cycle)} style={{ width: "auto", padding: "9px 18px" }}>
                        Export CSV (iBusiness)
                    </Button>
                    <Button variant="secondary" onClick={() => setIsPrintOpen(true)} style={{ width: "auto", padding: "9px 18px" }}>
                        Print Summary PDF
                    </Button>
                </div>
            )}

            {/* Table */}
            <Card style={{ padding: 0 }}>
                {loadingData ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : rows.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        {selectedCycleId ? "No payroll records found for this cycle." : "Select a closed cycle above."}
                    </div>
                ) : (
                    <>
                        <Table columns={columns} data={rows} />
                        <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "32px", fontSize: "13px", background: "#f8fafc" }}>
                            <span style={{ color: "#64748b" }}>Total Employees: <strong>{rows.length}</strong></span>
                            <span style={{ color: "#0f172a", fontWeight: "800", fontSize: "15px", fontFamily: "monospace" }}>
                                Total Net Pay: ฿{fc(data?.total_net_pay)}
                            </span>
                        </div>
                    </>
                )}
            </Card>

            {/* Print overlay */}
            {isPrintOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 3000, overflowY: "auto" }}>
                    <div id="print-toolbar" style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1e293b", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>Bank Transfer Summary Preview</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={handlePrint} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "700", fontSize: "13px" }}>Print / Save PDF</button>
                            <button onClick={() => setIsPrintOpen(false)} style={{ backgroundColor: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", padding: "9px 18px", fontWeight: "600", fontSize: "13px" }}>Close</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                        <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                            <A4BankSummary data={data} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BankTransferReportPage;
