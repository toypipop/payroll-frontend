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
            <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>
                Close
            </Button>
        }
    >
        {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : rows.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No salary history yet.</div>
        ) : (
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ color: "#94a3b8", fontWeight: 600, fontSize: "11px" }}>
                            <th style={{ width: "25%", textAlign: "left", padding: "4px 8px 8px 0" }}>Effective Date</th>
                            <th style={{ width: "25%", textAlign: "right", padding: "4px 8px" }}>Base Salary</th>
                            <th style={{ width: "25%", textAlign: "left", padding: "4px 8px" }}>Status</th>
                            <th style={{ width: "25%", textAlign: "right", padding: "4px 0 8px 8px" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((rec) => {
                            const date = rec.effective_date;
                            const dateLabel = date && !date.startsWith("0001")
                                ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                : "-";
                            return (
                                <tr key={rec.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                    <td style={{ width: "25%", padding: "7px 8px 7px 0" }}>{dateLabel}</td>
                                    <td style={{ width: "25%", textAlign: "right", padding: "7px 8px", fontFamily: "monospace" }}>
                                        {Number(rec.base_salaries || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ width: "25%", padding: "7px 8px" }}>
                                        <Badge status={rec.is_active}>{rec.is_active ? "Active" : "Archived"}</Badge>
                                    </td>
                                    <td style={{ width: "25%", textAlign: "right", padding: "7px 0 7px 8px" }}>
                                        {rec.can_delete ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => onDelete(rec.id)}
                                                style={{ padding: "4px 10px", fontSize: "12px", width: "auto", color: "#dc2626" }}
                                            >
                                                Delete
                                            </Button>
                                        ) : (
                                            <span style={{ fontSize: "11px", color: "#cbd5e1" }} title="Already used in a payroll calculation">
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
