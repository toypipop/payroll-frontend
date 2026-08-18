import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import DateField from "../../components/common/DateField";
import useAttendanceSummary from "./summaries/useAttendanceSummary";

const DeductionSummaryPage = () => {
    const { summary, loading, fromDate, setFromDate, toDate, setToDate, meta, fetchSummary } =
        useAttendanceSummary("/deduction/summary", "Failed to load deduction summary");

    const totalLateMin = summary.reduce((s, r) => s + r.total_late_minutes, 0);
    const totalAbsent = summary.reduce((s, r) => s + r.total_absent_days, 0);
    const totalAmount = summary.reduce((s, r) => s + r.total_amount, 0);

    const columns = [
        { label: "Code", key: "employees_code" },
        { label: "Full Name", key: "full_name" },
        { label: "Companies", key: "company_name" },
        {
            label: "LATE (M)",
            sortKey: "total_late_minutes",
            sortValue: (row) => Number(row.total_late_minutes) || 0,
            searchValue: (row) => String(Number(row.total_late_minutes) || 0),
            render: (row) => (
                <span className={row.total_late_minutes > 0 ? "text-accent" : undefined}>
                    {row.total_late_minutes.toFixed(1)}
                </span>
            ),
        },
        {
            label: "LATE ($)",
            sortKey: "late_amount",
            sortValue: (row) => Number(row.late_amount) || 0,
            searchValue: (row) => (Number(row.late_amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <span className={row.late_amount > 0 ? "text-danger" : undefined}>
                    {row.late_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            label: "ABSENT (D)",
            sortKey: "total_absent_days",
            sortValue: (row) => Number(row.total_absent_days) || 0,
            searchValue: (row) => String(Number(row.total_absent_days) || 0),
            render: (row) => (
                <span className={row.total_absent_days > 0 ? "text-accent" : undefined}>
                    {row.total_absent_days}
                </span>
            ),
        },
        {
            label: "ABSENT ($)",
            sortKey: "absent_amount",
            sortValue: (row) => Number(row.absent_amount) || 0,
            searchValue: (row) => (Number(row.absent_amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <span className={row.absent_amount > 0 ? "text-danger" : undefined}>
                    {row.absent_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            label: "Total Deduction ($)",
            sortKey: "total_amount",
            sortValue: (row) => Number(row.total_amount) || 0,
            searchValue: (row) => (Number(row.total_amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
            render: (row) => (
                <strong className={row.total_amount > 0 ? "text-danger-text" : undefined}>
                    {row.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </strong>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Deduction Summary" />

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
                            <div className="flex justify-end gap-[32px] p-[12px_24px] border-t border-t-line-muted text-[13px] font-semibold text-secondary">
                                <span>Total Late: {totalLateMin.toFixed(1)} min</span>
                                <span>Total Absent: {totalAbsent} days</span>
                                <span className="text-danger-text">
                                    Total Deduction: ${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </>
    );
};

export default DeductionSummaryPage;
