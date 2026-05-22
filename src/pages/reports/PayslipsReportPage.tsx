import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SelectField from "../../components/common/SelectField";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// A4 payslip document
const A4Payslip = ({ slip, cycle, company }) => {
    if (!slip) return null;

    const earnings = slip.details?.filter((d) => d.type === "earning") || [];
    const deductions = slip.details?.filter((d) => d.type === "deduction") || [];
    const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);

    const earningsColumns = [
        {
            label: "Earning",
            render: (item) => item.item_name,
        },
        {
            label: "Amount",
            render: (item) => (
                <span style={{ fontFamily: "monospace", color: "#059669", fontWeight: "600" }}>
                    {formatCurrency(item.amount)}
                </span>
            ),
        },
    ];

    const deductionsColumns = [
        {
            label: "Deduction",
            render: (item) => item.item_name,
        },
        {
            label: "Amount",
            render: (item) => (
                <span style={{ fontFamily: "monospace", color: "#dc2626", fontWeight: "600" }}>
                    ({formatCurrency(item.amount)})
                </span>
            ),
        },
    ];

    return (
        <div id="payslip-a4" style={{
            width: "210mm",
            minHeight: "297mm",
            backgroundColor: "#fff",
            padding: "16mm 14mm",
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: "13px",
            color: "#1e293b",
            boxSizing: "border-box",
        }}>
            {/* Company Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                paddingBottom: "14px", marginBottom: "14px",
                borderBottom: "3px solid #0f172a",
            }}>
                <div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", lineHeight: 1.2 }}>
                        {company?.name || "—"}
                    </div>
                    {company?.address && (
                        <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>{company.address}</div>
                    )}
                    {company?.phone && (
                        <div style={{ color: "#64748b", fontSize: "12px" }}>Tel: {company.phone}</div>
                    )}
                    {company?.tax_id && (
                        <div style={{ color: "#64748b", fontSize: "12px" }}>Tax ID: {company.tax_id}</div>
                    )}
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{
                        fontSize: "24px", fontWeight: "900", letterSpacing: "3px",
                        color: "#0f172a", textTransform: "uppercase",
                    }}>
                        PAYSLIP
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
                        {cycle?.cycle_name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>
                        {formatDate(cycle?.start_date)} — {formatDate(cycle?.end_date)}
                    </div>
                    <div style={{
                        marginTop: "6px", display: "inline-block",
                        backgroundColor: "#f1f5f9", borderRadius: "4px",
                        padding: "2px 10px", fontSize: "11px", color: "#64748b", fontWeight: 600,
                    }}>
                        CLOSED / LOCKED
                    </div>
                </div>
            </div>

            {/* Employee Info */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0", backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0", borderRadius: "6px",
                marginBottom: "18px", overflow: "hidden",
            }}>
                {[
                    ["Employee Name", `${slip.employees?.first_name || ""} ${slip.employees?.last_name || ""}`],
                    ["Employee Code", slip.employees?.employees_code || "—"],
                    ["Department", slip.employees?.department?.dept_name || "—"],
                    ["Position", slip.employees?.position?.pos_name || "—"],
                    ["Base Salary", `—${formatCurrency(slip.salaries_at_time)}`],
                    ["Pay Period", `${formatDate(cycle?.start_date)} — ${formatDate(cycle?.end_date)}`],
                ].map(([label, value], i) => (
                    <div key={i} style={{
                        padding: "10px 14px",
                        borderRight: i % 3 !== 2 ? "1px solid #e2e8f0" : "none",
                        borderBottom: i < 3 ? "1px solid #e2e8f0" : "none",
                    }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {label}
                        </div>
                        <div style={{ fontWeight: "600", fontSize: "13px", marginTop: "3px", color: "#0f172a" }}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Earnings & Deductions Side-by-Side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                {/* Earnings */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{
                        backgroundColor: "#064e3b", color: "#fff",
                        padding: "9px 14px", fontWeight: "700", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "1px",
                    }}>
                        Earnings
                    </div>
                    <Table columns={earningsColumns} data={earnings} />
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr auto",
                        padding: "9px 14px", backgroundColor: "#ecfdf5", fontWeight: "800", fontSize: "13px"
                    }}>
                        <div>Total Earnings</div>
                        <div style={{
                            fontFamily: "monospace",
                            fontSize: "14px", color: "#059669",
                        }}>
                            {formatCurrency(slip.total_earning)}
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{
                        backgroundColor: "#7f1d1d", color: "#fff",
                        padding: "9px 14px", fontWeight: "700", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "1px",
                    }}>
                        Deductions
                    </div>
                    <Table columns={deductionsColumns} data={deductions} />
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr auto",
                        padding: "9px 14px", backgroundColor: "#fef2f2", fontWeight: "800", fontSize: "13px"
                    }}>
                        <div>Total Deductions</div>
                        <div style={{
                            fontFamily: "monospace",
                            fontSize: "14px", color: "#dc2626",
                        }}>
                            ({formatCurrency(totalDeductions)})
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                backgroundColor: "#0f172a", color: "#fff",
                borderRadius: "8px", padding: "18px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                        Net Pay
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "900", fontFamily: "monospace", marginTop: "4px" }}>
                        —{formatCurrency(slip.net_pay)}
                    </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", color: "#94a3b8", lineHeight: "1.8" }}>
                    <div>Gross Earnings &nbsp;&nbsp; —{formatCurrency(slip.total_earning)}</div>
                    <div>Total Deductions &nbsp; (—{formatCurrency(totalDeductions)})</div>
                </div>
            </div>

            {/* Signature Block */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px",
                marginTop: "36px", paddingTop: "16px", borderTop: "1px solid #e2e8f0",
            }}>
                {["Employee", "HR / Payroll Officer", "Authorised By"].map((label) => (
                    <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ height: "40px", borderBottom: "1px solid #334155" }} />
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>{label}</div>
                    </div>
                ))}
            </div>
            {/* Footer note */}
            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
                This payslip is computer-generated. Payroll cycle: {cycle?.cycle_name} — Records are immutable once the cycle is closed.
            </div>
        </div>
    );
};

const PayslipsReportPage = () => {
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [selectedCycle, setSelectedCycle] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const [slip, setSlip] = useState(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);
    const [loadingSlip, setLoadingSlip] = useState(false);

    const fetchCycles = async () => {
        try {
            setLoadingCycles(true);
            const res = await api.get("/payroll/cycles");
            const closed = (res.data || []).filter((c) => c.is_closed);
            setCycles(closed);
            if (closed.length > 0) setSelectedCycleId(closed[0].id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCycles(false);
        }
    };

    const fetchTransactions = async (cycleId) => {
        if (!cycleId) return;
        try {
            setLoadingTx(true);
            const res = await api.get(`/payroll/transactions/${cycleId}`);
            setSelectedCycle(res.data.cycle);
            setTransactions(res.data.transactions || []);
            } catch (err) {
            setTransactions([]);
            setSelectedCycle(null);
        } finally {
            setLoadingTx(false);
        }
    };

    useEffect(() => { fetchCycles(); }, []);
    useEffect(() => { fetchTransactions(selectedCycleId); }, [selectedCycleId]);

    useEffect(() => {
        if (!isSlipOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isSlipOpen]);

    const handleViewSlip = async (transactionId) => {
        try {
            setLoadingSlip(true);
            setIsSlipOpen(true);
            setSlip(null);
            const res = await api.get(`/payslips/${transactionId}`);
            setSlip(res.data);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to load payslip");
            setIsSlipOpen(false);
        } finally {
            setLoadingSlip(false);
        }
    };

    const handleCloseSlip = () => {
        setIsSlipOpen(false);
        setSlip(null);
    };

    const handlePrint = () => {
        const style = document.createElement("style");
        style.innerHTML = `
            @media print {
                body * { visibility: hidden !important; }
                #payslip-a4, #payslip-a4 * { visibility: visible !important; }
                #payslip-a4 {
                    position: fixed !important;
                    top: 0 !important; left: 0 !important;
                    width: 210mm !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                }
                @page { margin: 0; size: A4; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    const slipData = slip?.slip;
    const cycleData = slip?.cycle;
    const companyData = slip?.company;

    const columns = [
        {
            label: "Employee",
            render: (row) => (
                <div>
                    <div style={{ fontWeight: "600", color: "#1e293b" }}>
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        {row.employees?.employees_code}
                    </div>
                </div>
            ),
        },
        {

            label: "Department",
            render: (row) => (
                <span style={{ fontSize: "13px" }}>{row.employees?.department?.dept_name || "—"}</span>
            ),
        },
        {
            label: "Position",
            render: (row) => (
                <span style={{ fontSize: "13px" }}>{row.employees?.position?.pos_name || "—"}</span>
            ),
        },
        {
            label: "Gross Earnings",
            render: (row) => (
                <span style={{ fontFamily: "monospace", color: "#059669", fontWeight: "600" }}>
                    —{formatCurrency(row.total_earning)}
                </span>
            ),
        },
        {
            label: "Net Pay",
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                    —{formatCurrency(row.net_pay)}
                </span>
            ),
        },
        {
            label: "Companies",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "",
            render: (row) => (
                <Button
                    variant="ghost"
                    onClick={() => handleViewSlip(row.id)}
                    style={{ fontSize: "12px", padding: "6px 14px", width: "auto" }}
                >
                    View / Print Slip
                </Button>
            ),
        },
    ];

    const payslipPreview = isSlipOpen ? (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "#0f172a", zIndex: 10000,
            overflowY: "auto",
        }}>
            {/* Toolbar — hidden on print */}
            <div id="payslip-toolbar" style={{
                position: "sticky", top: 0, zIndex: 1,
                backgroundColor: "#1e293b",
                padding: "12px 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}>
                <div>
                    <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
                        Payslip Preview
                    </span>
                    {slipData && (
                        <span style={{ color: "#94a3b8", fontSize: "13px", marginLeft: "12px" }}>
                            {slipData.employees?.first_name} {slipData.employees?.last_name} &nbsp;&middot;&nbsp; {cycleData?.cycle_name}
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {slipData && (
                        <button
                            onClick={handlePrint}
                            style={{
                                backgroundColor: "#10b981", color: "#fff",
                                border: "none", borderRadius: "8px", cursor: "pointer",
                                padding: "9px 18px", fontWeight: "700", fontSize: "13px",
                                display: "flex", alignItems: "center", gap: "6px",
                            }}
                        >
                            Print / Save PDF
                        </button>
                    )}
                    <button
                        onClick={handleCloseSlip}
                        style={{
                            backgroundColor: "transparent", color: "#94a3b8",
                            border: "1px solid #334155", borderRadius: "8px", cursor: "pointer",
                            padding: "9px 18px", fontWeight: "600", fontSize: "13px",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* A4 slip content */}
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
                {loadingSlip ? (
                    <div style={{ color: "#94a3b8", fontSize: "14px", paddingTop: "60px" }}>
                        Loading payslip...
                    </div>
                ) : slipData ? (
                    <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                        <A4Payslip slip={slipData} cycle={cycleData} company={companyData} />
                    </div>
                ) : null}
            </div>
        </div>
    ) : null;
    return (
        <>
            <PageHeader title="Payslips" />

            {/* Cycle selector */}
            <Card style={{ marginBottom: "20px" }}>
                {loadingCycles ? (
                    <div style={{ color: "#94a3b8", fontSize: "14px" }}>Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: "14px" }}>
                        No closed cycles available. Close a payroll cycle to access payslips.
                    </div>
                ) : (
                    <>
                        <SelectField
                            label="Select Closed Payroll Cycle"
                            options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name}${c.companies?.name ? ` (${c.companies.name})` : ""}` }))}
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            containerStyle={{ marginBottom: 0 }}
                        />
                        {selectedCycle && (
                            <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
                                Period: <strong>{formatDate(selectedCycle.start_date)}</strong> —&nbsp;
                                <strong>{formatDate(selectedCycle.end_date)}</strong>
                                <Badge status="cancelled">Closed / Locked</Badge>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Transactions table */}
            <Card style={{ padding: "0px" }}>
                {loadingTx ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        {selectedCycleId
                            ? "No payroll records found for this cycle. Run payroll before closing the cycle."
                            : "Select a closed cycle above to view payslips."}
                    </div>
                ) : (
                    <Table columns={columns} data={transactions} />
                )}
            </Card>

            {payslipPreview && createPortal(payslipPreview, document.body)}
        </>
    );
};

export default PayslipsReportPage;
