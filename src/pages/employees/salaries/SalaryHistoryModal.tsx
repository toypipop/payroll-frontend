import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Badge from "../../../components/common/Badge";
import type { Employee, SalaryHistoryRow } from "../../../types/domain";
import type { ApiId } from "../../../types/api";
import { lockedReason } from "./salaryShape";
import { auditActionLabel, auditChangeText } from "./auditLine";
import { useSalaryAudit } from "./useSalaryAudit";

interface SalaryHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    rows: SalaryHistoryRow[];
    loading: boolean;
    onDelete: (recordId?: ApiId) => void;
    onEdit: (record: SalaryHistoryRow) => void;
}

// A record's status is read from the timeline, not from a flag on the row: `is_active` says the record is switched
// on, and several are, so labelling every switched-on record "Active" would leave the reader unable to tell which
// figure is actually being paid. The one in force is the switched-on record with the latest effective date.
const statusOf = (rec: SalaryHistoryRow, currentId: ApiId | undefined) => {
    if (!rec.is_active) return { label: "Switched off", active: false };
    if (rec.id === currentId) return { label: "In force", active: true };
    return { label: "History", active: false };
};

// SalaryHistoryModal is read-only apart from deleting a record the backend still allows to be removed.
const SalaryHistoryModal = ({ isOpen, onClose, employee, rows, loading, onDelete, onEdit }: SalaryHistoryModalProps) => {
    // The rows arrive newest first, so the record in force is the first switched-on one.
    const currentRecordId = rows.find((rec) => rec.is_active)?.id;
    // The trail is loaded only while the modal is open, and covers changes to records that no longer exist.
    const { entries: auditEntries, loading: auditLoading } = useSalaryAudit(isOpen ? employee?.id : undefined);

    return (
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
                            <th className="w-[20%] text-left p-[4px_8px]">Status</th>
                            <th className="w-[30%] text-right p-[4px_0_8px_8px]">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((rec) => {
                            const status = statusOf(rec, currentRecordId);
                            const locked = lockedReason(rec.locked_by);
                            const date = rec.effective_date;
                            const dateLabel = date && !date.startsWith("0001")
                                ? new Date(date).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" })
                                : "-";
                            return (
                                <tr key={rec.id} className="border-t border-t-hover">
                                    <td className="w-[25%] p-[7px_8px_7px_0]">{dateLabel}</td>
                                    <td className="w-[25%] text-right p-[7px_8px] font-mono">
                                        {Number(rec.base_salaries || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="w-[20%] p-[7px_8px]">
                                        <Badge status={status.active}>{status.label}</Badge>
                                    </td>
                                    <td className="w-[30%] text-right p-[7px_0_7px_8px]">
                                        {/* A record a closed cycle was calculated from is the basis of a payslip
                                            already paid out, so neither its date nor its figure may move. */}
                                        {rec.can_delete ? (
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => onEdit(rec)}
                                                    className="w-auto px-2.5 py-1 text-xs"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => onDelete(rec.id)}
                                                    className="w-auto px-2.5 py-1 text-xs text-danger-text"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        ) : (
                                            <span
                                                className="inline-flex flex-col items-end text-[11px] leading-tight text-line-input"
                                                title={locked.title}
                                            >
                                                <span>Locked</span>
                                                {locked.label && (
                                                    <span className="text-[10px] text-subtle">{locked.label}</span>
                                                )}
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

        <div className="mt-5 border-t border-t-hover pt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Change log</div>
            {auditLoading ? (
                <div className="text-[12px] text-subtle">Loading...</div>
            ) : auditEntries.length === 0 ? (
                <div className="text-[12px] text-subtle">
                    No changes recorded yet — the log starts from the first change made here.
                </div>
            ) : (
                <ul className="flex flex-col gap-2.5">
                    {auditEntries.map((entry) => {
                        const change = auditChangeText(entry);
                        return (
                            <li key={entry.id} className="text-[12px] leading-snug">
                                <div className="text-main">
                                    <span className="font-semibold">{auditActionLabel(entry.action)}</span>
                                    <span className="text-subtle"> · {entry.actor_name} · </span>
                                    <span className="text-subtle">
                                        {new Date(entry.created_at).toLocaleDateString("en-GB", {
                                            timeZone: "Asia/Bangkok",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                {change && <div className="text-subtle">{change}</div>}
                                <div className="text-main">&ldquo;{entry.reason}&rdquo;</div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    </Modal>
    );
};

export default SalaryHistoryModal;
