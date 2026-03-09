import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
            const all = res.data || [];
            setCycles(all);
            if (all.length > 0) setSelectedCycleId(all[0].id);
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
            if (err.response?.status !== 404) console.error(err);
        } finally {
            setLoadingTx(false);
        }
    };

    useEffect(() => { fetchCycles(); }, []);
    useEffect(() => { fetchTransactions(selectedCycleId); }, [selectedCycleId]);

    const handleViewSlip = async (transactionId) => {
        try {
            setLoadingSlip(true);
            setIsSlipOpen(true);
            const res = await api.get(`/payroll/slip/${transactionId}`);
            setSlip(res.data);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to load payslip");
            setIsSlipOpen(false);
        } finally {
            setLoadingSlip(false);
        }
    };

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
            label: "Net Pay",
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0f172a" }}>
                    ฿{formatCurrency(row.net_pay)}
                </span>
            ),
        },
        {
            label: "Actions",
            render: (row) => (
                <Button
                    variant="ghost"
                    onClick={() => handleViewSlip(row.id)}
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                >
                    View Slip
                </Button>
            ),
        },
    ];

    // --- Payslip modal content ---
    const slipData = slip?.slip;
    const cycleData = slip?.cycle;
    const earnings = slipData?.details?.filter((d) => d.type === "earning") || [];
    const deductions = slipData?.details?.filter((d) => d.type === "deduction") || [];

    return (
        <>
            <PageHeader title="Payslips" />

            {/* Cycle selector */}
            <Card style={{ marginBottom: "20px" }}>
                <div>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>
                        Select Payroll Cycle
                    </label>
                    {loadingCycles ? (
                        <div style={{ color: "#94a3b8", fontSize: "14px" }}>Loading cycles...</div>
                    ) : cycles.length === 0 ? (
                        <div style={{ color: "#94a3b8", fontSize: "14px" }}>No cycles available.</div>
                    ) : (
                        <select
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            style={{
                                padding: "10px 14px", borderRadius: "8px",
                                border: "1px solid #e2e8f0", fontSize: "14px",
                                outline: "none", minWidth: "260px", cursor: "pointer",
                            }}
                        >
                            {cycles.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.cycle_name} {c.is_closed ? "(Closed)" : "(Open)"}
                                </option>
                            ))}
                        </select>
                    )}

                    {selectedCycle && (
                        <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                            Period: <strong>{formatDate(selectedCycle.start_date)}</strong> — <strong>{formatDate(selectedCycle.end_date)}</strong>
                        </div>
                    )}
                </div>
            </Card>

            {/* Transactions table */}
            <Card style={{ padding: "0px" }}>
                {loadingTx ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        No payroll results for this cycle. Run payroll first.
                    </div>
                ) : (
                    <Table columns={columns} data={transactions} />
                )}
            </Card>

            {/* Payslip Modal */}
            <Modal
                isOpen={isSlipOpen}
                onClose={() => { setIsSlipOpen(false); setSlip(null); }}
                title="Payslip"
                footer={
                    <Button variant="ghost" onClick={() => { setIsSlipOpen(false); setSlip(null); }} style={{ width: "auto" }}>
                        Close
                    </Button>
                }
            >
                {loadingSlip ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading payslip...</div>
                ) : slipData ? (
                    <div style={{ fontSize: "14px" }}>

                        {/* Employee Info */}
                        <div style={{
                            backgroundColor: "#f8fafc", borderRadius: "10px",
                            padding: "16px", marginBottom: "20px",
                        }}>
                            <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>
                                {slipData.employees?.first_name} {slipData.employees?.last_name}
                            </div>
                            <div style={{ color: "#64748b", marginTop: "4px", fontSize: "13px" }}>
                                {slipData.employees?.employees_code} · {slipData.employees?.department?.dept_name || "—"} · {slipData.employees?.position?.pos_name || "—"}
                            </div>
                            {cycleData && (
                                <div style={{ color: "#64748b", marginTop: "4px", fontSize: "13px" }}>
                                    Cycle: <strong>{cycleData.cycle_name}</strong> ({formatDate(cycleData.start_date)} — {formatDate(cycleData.end_date)})
                                </div>
                            )}
                        </div>

                        {/* Earnings */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{
                                fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                                letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "8px"
                            }}>
                                Earnings
                            </div>
                            {earnings.map((item, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                                    <span style={{ color: "#475569" }}>{item.item_name}</span>
                                    <span style={{ fontFamily: "monospace", color: "#10b981", fontWeight: "600" }}>
                                        + ฿{formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: "700" }}>
                                <span>Total Earning</span>
                                <span style={{ fontFamily: "monospace", color: "#10b981" }}>฿{formatCurrency(slipData.total_earning)}</span>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{
                                fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                                letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "8px"
                            }}>
                                Deductions
                            </div>
                            {deductions.map((item, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                                    <span style={{ color: "#475569" }}>{item.item_name}</span>
                                    <span style={{ fontFamily: "monospace", color: "#ef4444", fontWeight: "600" }}>
                                        − ฿{formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: "700" }}>
                                <span>Total Deduction (incl. SSO &amp; Tax)</span>
                                <span style={{ fontFamily: "monospace", color: "#ef4444" }}>
                                    ฿{formatCurrency(
                                        (slipData.total_deduction || 0) +
                                        (slipData.sso_amount || 0) +
                                        (slipData.tax_amount || 0)
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Net Pay */}
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "14px 16px", borderRadius: "10px",
                            backgroundColor: "#0f172a", color: "#fff",
                            fontWeight: "700", fontSize: "16px",
                        }}>
                            <span>Net Pay</span>
                            <span style={{ fontFamily: "monospace" }}>฿{formatCurrency(slipData.net_pay)}</span>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </>
    );
};

export default PayslipsReportPage;
