import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import DateField from "../../components/common/DateField";
import useAttendanceSummary from "./summaries/useAttendanceSummary";

const EarningSummaryPage = () => {
    const { summary, loading, fromDate, setFromDate, toDate, setToDate, meta, fetchSummary } =
        useAttendanceSummary("/earning/summary", "Failed to load earning summary");

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
                <span style={{ color: row.total_extra_days > 0 ? "var(--status-success-text)" : undefined }}>
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
                <strong style={{ color: row.total_amount > 0 ? "var(--primary-color)" : undefined }}>
                    {row.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </strong>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Earning Summary" />

            <Card className="mb-4">
                <div className="flex gap-[16px] items-end flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                        <DateField
                            label="From Date"
                            value={fromDate}
                            onChange={setFromDate}
                        />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <DateField
                            label="To Date"
                            value={toDate}
                            onChange={setToDate}
                        />
                    </div>
                    <div className="mt-[16px] mb-[20px]">
                        <Button onClick={fetchSummary}>
                            Search
                        </Button>
                    </div>
                </div>
                {meta.from && (
                    <div className="mt-[8px] text-[13px] text-muted">
                        Showing: {meta.from} {"->"} {meta.to}
                    </div>
                )}
            </Card>

            <Card className="p-0">
                {loading ? (
                    <div className="p-[40px] text-center">Loading...</div>
                ) : (
                    <>
                        <Table columns={columns} data={summary} />
                        {summary.length > 0 && (
                            <div
                                className="flex justify-end gap-[32px] p-[12px_24px] border-t border-t-line-muted text-[13px] font-semibold text-[#374151]"
                            >
                                <span>Total OT: {totalOtMins.toFixed(1)} min</span>
                                <span>Total Extra: {totalExtraDays} days</span>
                                <span className="text-primary">
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
