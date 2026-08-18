import Card from "../../../components/common/Card";
import Modal from "../../../components/common/Modal";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const detailColumns = [
    { label: "Item", key: "item_name" },
    {
        label: "Type",
        sortKey: "type",
        sortValue: (row) => (row.type || "").toLowerCase(),
        render: (row) => <Badge status={row.type === "earning" ? "active" : "rejected"}>{row.type}</Badge>,
    },
    {
        label: "Amount",
        sortKey: "amount",
        sortValue: (row) => Number(row.amount) || 0,
        render: (row) => (
            <span className="font-mono font-semibold">฿{formatCurrency(row.amount)}</span>
        ),
    },
];

// PayslipDetailsModal shows one of the caller's own closed payslips, read-only.
const PayslipDetailsModal = ({ slip, onClose }) => (
    <Modal
        isOpen={!!slip}
        onClose={onClose}
        title={`Payslip — ${slip?.cycle_name || ""}`}
    >
        {slip && (
            <>
                <div className="flex justify-between mb-[10px] text-[13px]">
                    <span className="text-muted">Period</span>
                    <span className="font-semibold">{formatDate(slip.start_date)} – {formatDate(slip.end_date)}</span>
                </div>
                <div className="flex justify-between mb-[6px] text-[13px]">
                    <span className="text-muted">Position (at payout)</span>
                    <span className="font-semibold">{slip.position_name || "-"}</span>
                </div>
                <div className="flex justify-between mb-[6px] text-[13px]">
                    <span className="text-muted">Department (at payout)</span>
                    <span className="font-semibold">{slip.department_name || "-"}</span>
                </div>
                <div className="flex justify-between mb-[10px] text-[13px]">
                    <span className="text-muted">Paid to Bank Account</span>
                    <span className="font-semibold">
                        {slip.bank_name || "-"} {slip.bank_account_no ? `(${slip.bank_account_no})` : ""}
                    </span>
                </div>
                <div className="flex justify-between mb-[12px] text-[13px]">
                    <span className="text-muted">Net Pay</span>
                    <span className="font-bold text-main">฿{formatCurrency(slip.net_pay)}</span>
                </div>
                <div className="m-[12px_0]">
                    <Badge status="cancelled">Read-only audit trail</Badge>
                </div>
                <Card className="p-0">
                    <Table columns={detailColumns} data={slip.details || []} />
                </Card>
            </>
        )}
    </Modal>
);

export default PayslipDetailsModal;
