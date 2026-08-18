import Card from "../../../components/common/Card";
import Modal from "../../../components/common/Modal";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

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
        searchValue: (row) => (Number(row.amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        render: (row) => (
            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                ฿{formatCurrency(row.amount)}
            </span>
        ),
    },
];

// TransactionDetailsModal shows one closed payslip. Everything in it is a read-only audit trail.
const TransactionDetailsModal = ({ transaction, slipData, slipError, loading, onClose }) => (
    <Modal
        isOpen={!!transaction}
        onClose={onClose}
        title={`Transaction Details${transaction?.employees ? ` - ${transaction.employees.first_name} ${transaction.employees.last_name}` : ""}`}
    >
        {loading ? (
            <div style={{ padding: "12px 0", color: "#94a3b8" }}>Loading details...</div>
        ) : slipError ? (
            <div style={{ padding: "12px 0", color: "#ef4444" }}>{slipError}</div>
        ) : !slipData?.slip ? (
            <div style={{ padding: "12px 0", color: "#94a3b8" }}>No data available.</div>
        ) : (
            <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Cycle</span>
                    <span style={{ fontWeight: 600 }}>{slipData.cycle?.cycle_name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Position (at payout)</span>
                    <span style={{ fontWeight: 600 }}>{slipData.slip.position_name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Department (at payout)</span>
                    <span style={{ fontWeight: 600 }}>{slipData.slip.department_name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Paid to Bank Account</span>
                    <span style={{ fontWeight: 600 }}>
                        {slipData.slip.bank_name || "-"} {slipData.slip.bank_account_no ? `(${slipData.slip.bank_account_no})` : ""}
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Net Pay</span>
                    <span style={{ fontWeight: 700 }}>฿{formatCurrency(slipData.slip.net_pay)}</span>
                </div>
                <div style={{ margin: "12px 0" }}>
                    <Badge status="cancelled">Read-only audit trail</Badge>
                </div>
                <Card style={{ padding: "0px" }}>
                    <Table columns={detailColumns} data={slipData.slip.details || []} />
                </Card>
            </>
        )}
    </Modal>
);

export default TransactionDetailsModal;
