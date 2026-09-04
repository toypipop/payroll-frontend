import Card from "../../../components/common/Card";
import Modal from "../../../components/common/Modal";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import type { PayrollTransaction, PayrollTransactionDetail, PayslipResponse, TableColumn } from "../../../types/api";

const formatCurrency = (value: number | string | null | undefined) =>
    Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const detailColumns: TableColumn<PayrollTransactionDetail>[] = [
    { label: "Item", key: "item_name" },
    {
        label: "Type",
        sortKey: "type",
        sortValue: (row) => (row.type || "").toLowerCase(),
        render: (row) => {
            const isStatutoryWithholding = row.item_name === "Social Security (SSO)" || row.item_name === "Income Tax";
            return isStatutoryWithholding
                ? <Badge status="pending">Statutory</Badge>
                : <Badge status={row.type === "earning" ? "active" : "rejected"}>{row.type}</Badge>;
        },
    },
    {
        label: "Amount",
        sortKey: "amount",
        sortValue: (row) => Number(row.amount) || 0,
        searchValue: (row) => (Number(row.amount) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        render: (row) => (
            <span className="font-mono font-semibold">
                ฿{formatCurrency(row.amount)}
            </span>
        ),
    },
];

// TransactionDetailsModal shows one closed payslip. Everything in it is a read-only audit trail.
interface TransactionDetailsModalProps {
    transaction: PayrollTransaction | null;
    slipData: PayslipResponse | null;
    slipError: string | null;
    loading: boolean;
    onClose: () => void;
}

const TransactionDetailsModal = ({ transaction, slipData, slipError, loading, onClose }: TransactionDetailsModalProps) => (
    <Modal
        isOpen={!!transaction}
        onClose={onClose}
        title={`Transaction Details${transaction?.employees ? ` - ${transaction.employees.first_name} ${transaction.employees.last_name}` : ""}`}
    >
        {loading ? (
            <div className="p-[12px_0] text-subtle">Loading details...</div>
        ) : slipError ? (
            <div className="p-[12px_0] text-danger">{slipError}</div>
        ) : !slipData?.slip ? (
            <div className="p-[12px_0] text-subtle">No data available.</div>
        ) : (
            <>
                <div className="flex justify-between mb-[12px] text-[13px]">
                    <span className="text-muted">Cycle</span>
                    <span className="font-semibold">{slipData.cycle?.cycle_name || "-"}</span>
                </div>
                <div className="flex justify-between mb-[6px] text-[13px]">
                    <span className="text-muted">Position (at payout)</span>
                    <span className="font-semibold">{slipData.slip.position_name || "-"}</span>
                </div>
                <div className="flex justify-between mb-[6px] text-[13px]">
                    <span className="text-muted">Department (at payout)</span>
                    <span className="font-semibold">{slipData.slip.department_name || "-"}</span>
                </div>
                <div className="flex justify-between mb-[12px] text-[13px]">
                    <span className="text-muted">Paid to Bank Account</span>
                    <span className="font-semibold">
                        {slipData.slip.bank_name || "-"} {slipData.slip.bank_account_no ? `(${slipData.slip.bank_account_no})` : ""}
                    </span>
                </div>
                <div className="flex justify-between mb-[12px] text-[13px]">
                    <span className="text-muted">Net Pay</span>
                    <span className="font-bold">฿{formatCurrency(slipData.slip.net_pay)}</span>
                </div>
                <div className="m-[12px_0]">
                    <Badge status="cancelled">Read-only audit trail</Badge>
                </div>
                <Card className="p-0">
                    <Table columns={detailColumns} data={slipData.slip.details || []} />
                </Card>
            </>
        )}
    </Modal>
);

export default TransactionDetailsModal;
