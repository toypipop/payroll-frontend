import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Badge from "../../../components/common/Badge";

// SalaryHistoryModal is read-only apart from deleting a record the backend still allows to be removed.
const SalaryHistoryModal = ({ isOpen, onClose, employee, rows, loading, onDelete }) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Salary History: ${employee?.first_name} ${employee?.last_name}`}
        footer={
            <Button variant="ghost" onClick={onClose}>
                Close
            </Button>
        }
    >
        {loading ? (
            <div className="p-[20px] text-center text-subtle">Loading...</div>
        ) : rows.length === 0 ? (
            <div className="p-[20px] text-center text-subtle">No salary history yet.</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-[100%] table-fixed border-collapse text-[13px]">
                    <thead>
                        <tr className="text-subtle font-semibold text-[11px]">
                            <th className="w-[25%] text-left p-[4px_8px_8px_0]">Effective Date</th>
                            <th className="w-[25%] text-right p-[4px_8px]">Base Salary</th>
                            <th className="w-[25%] text-left p-[4px_8px]">Status</th>
                            <th className="w-[25%] text-right p-[4px_0_8px_8px]">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((rec) => {
                            const date = rec.effective_date;
                            const dateLabel = date && !date.startsWith("0001")
                                ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                : "-";
                            return (
                                <tr key={rec.id} className="border-t border-t-hover">
                                    <td className="w-[25%] p-[7px_8px_7px_0]">{dateLabel}</td>
                                    <td className="w-[25%] text-right p-[7px_8px] font-mono">
                                        {Number(rec.base_salaries || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="w-[25%] p-[7px_8px]">
                                        <Badge status={rec.is_active}>{rec.is_active ? "Active" : "Archived"}</Badge>
                                    </td>
                                    <td className="w-[25%] text-right p-[7px_0_7px_8px]">
                                        {rec.can_delete ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => onDelete(rec.id)}
                                                style={{ padding: "4px 10px", fontSize: "12px", width: "auto", color: "var(--status-danger-text)" }}
                                            >
                                                Delete
                                            </Button>
                                        ) : (
                                            <span className="text-[11px] text-line-input" title="Already used in a payroll calculation">
                                                Locked
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </Modal>
);

export default SalaryHistoryModal;
