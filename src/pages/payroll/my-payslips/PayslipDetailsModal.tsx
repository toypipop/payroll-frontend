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
            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>฿{formatCurrency(row.amount)}</span>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Period</span>
                    <span style={{ fontWeight: 600 }}>{formatDate(slip.start_date)} – {formatDate(slip.end_date)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Position (at payout)</span>
                    <span style={{ fontWeight: 600 }}>{slip.position_name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Department (at payout)</span>
                    <span style={{ fontWeight: 600 }}>{slip.department_name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Paid to Bank Account</span>
                    <span style={{ fontWeight: 600 }}>
                        {slip.bank_name || "-"} {slip.bank_account_no ? `(${slip.bank_account_no})` : ""}
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Net Pay</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>฿{formatCurrency(slip.net_pay)}</span>
                </div>
                <div style={{ margin: "12px 0" }}>
                    <Badge status="cancelled">Read-only audit trail</Badge>
                </div>
                <Card style={{ padding: "0px" }}>
                    <Table columns={detailColumns} data={slip.details || []} />
                </Card>
            </>
        )}
    </Modal>
);

export default PayslipDetailsModal;
