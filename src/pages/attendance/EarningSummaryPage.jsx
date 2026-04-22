import React, { useState, useEffect, useCallback } from "react";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import DateField from "../../components/common/DateField";

const toDateStr = (date) => {
    if (!date) return "";

    if (typeof date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "";
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const EarningSummaryPage = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`);
    const [toDate, setToDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    const [meta, setMeta] = useState({ from: "", to: "" });

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/earning/summary", {
                params: { from: toDateStr(fromDate), to: toDateStr(toDate) },
            });
            setSummary(res.data.summary || []);
            setMeta({ from: res.data.from, to: res.data.to });
        } catch (err) {
            console.error("Fetch Error:", err);
            alert(err.response?.data?.error || "Failed to load earning summary");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    const totalOtMins = summary.reduce((s, r) => s + r.total_overtime_minutes, 0);
    const totalExtraDays = summary.reduce((s, r) => s + r.total_extra_days, 0);
    const totalAmount = summary.reduce((s, r) => s + r.total_amount, 0);

    const columns = [
        { label: "Code", key: "employees_code" },
        { label: "Full Name", key: "full_name" },
        { label: "Companies", key: "company_name" },
        {
            label: "OT (M)",
            sortKey: "total_overtime_minutes",
            sortValue: (row) => Number(row.total_overtime_minutes) || 0,
            searchValue: (row) => String(Number(row.total_overtime_minutes) || 0),
            render: (row) => (
                <span style={{ color: row.total_overtime_minutes > 0 ? "#0ea5e9" : undefined }}>
                    {row.total_overtime_minutes.toFixed(1)}
                </span>
            ),
        },
        {
            label: "EXTRA (D)",
            sortKey: "total_extra_days",
            sortValue: (row) => Number(row.total_extra_days) || 0,
            searchValue: (row) => String(Number(row.total_extra_days) || 0),
            render: (row) => (
                <span style={{ color: row.total_extra_days > 0 ? "#16a34a" : undefined }}>
                    {row.total_extra_days}
                </span>
            ),
        },
        {
            label: "OT ($)",
            sortKey: "overtime_amount",
            sortValue: (row) => Number(row.overtime_amount) || 0,
            searchValue: (row) => (Number(row.overtime_amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <span style={{ color: row.overtime_amount > 0 ? "#0284c7" : undefined }}>
                    {row.overtime_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            label: "EXTRA ($)",
            sortKey: "extra_amount",
            sortValue: (row) => Number(row.extra_amount) || 0,
            searchValue: (row) => (Number(row.extra_amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <span style={{ color: row.extra_amount > 0 ? "#15803d" : undefined }}>
                    {row.extra_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            label: "EARNING ($)",
            sortKey: "total_amount",
            sortValue: (row) => Number(row.total_amount) || 0,
            searchValue: (row) => (Number(row.total_amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <strong style={{ color: row.total_amount > 0 ? "#0f766e" : undefined }}>
                    {row.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </strong>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Earning Summary" />

            <Card style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                        <DateField
                            label="From Date"
                            value={fromDate}
                            onChange={setFromDate}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                        <DateField
                            label="To Date"
                            value={toDate}
                            onChange={setToDate}
                        />
                    </div>
                    <div style={{ marginTop: "16px", marginBottom: "20px" }}>
                        <Button onClick={fetchSummary} style={{ width: "auto" }}>
                            Search
                        </Button>
                    </div>
                </div>
                {meta.from && (
                    <div style={{ marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
                        Showing: {meta.from} {"->"} {meta.to}
                    </div>
                )}
            </Card>

            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <>
                        <Table columns={columns} data={summary} />
                        {summary.length > 0 && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "32px",
                                    padding: "12px 24px",
                                    borderTop: "1px solid #e2e8f0",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#374151",
                                }}
                            >
                                <span>Total OT: {totalOtMins.toFixed(1)} min</span>
                                <span>Total Extra: {totalExtraDays} days</span>
                                <span style={{ color: "#0f766e" }}>
                                    Total Earning: ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </>
    );
};

export default EarningSummaryPage;
