import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { bangkokDateKey, formatDisplayTime } from "../../utils/bangkokTime";
import { auditSnapshotTarget, formatAuditSnapshot, type AuditSnapshot } from "./audit-log-details";
import PermissionAuditDetails from "./PermissionAuditDetails";

export interface AuditLogRow {
    id: number;
    occurred_at: string;
    actor_name_snapshot: string;
    event_type: string;
    entity_type: string;
    entity_id: number | null;
    summary: string;
    reason: string;
    before_data: AuditSnapshot;
    after_data: AuditSnapshot;
}

interface AuditLogDetailsModalProps {
    entry: AuditLogRow;
    onClose: () => void;
}

const humanize = (value: string) => value.split(/[._]/).filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");

const occurredAt = (value: string) => `${bangkokDateKey(value)} ${formatDisplayTime(value)}`;

const SnapshotSection = ({ title, snapshot }: { title: string; snapshot: AuditSnapshot }) => {
    const fields = formatAuditSnapshot(snapshot);
    return (
        <section className="rounded-xl border border-line-muted bg-surface p-4">
            <h4 className="text-sm font-semibold text-main">{title}</h4>
            {fields.length === 0 ? <p className="mt-2 text-sm text-subtle">No values recorded.</p> : (
                <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 gap-y-2 text-sm">
                    {fields.map((field) => (
                        <div key={field.label} className="contents">
                            <dt className="text-muted">{field.label}</dt>
                            <dd className="break-words text-right font-medium text-main">{field.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    );
};

const AuditLogDetailsModal = ({ entry, onClose }: AuditLogDetailsModalProps) => {
    const target = auditSnapshotTarget(entry.after_data) === "Name unavailable in this audit snapshot"
        ? auditSnapshotTarget(entry.before_data)
        : auditSnapshotTarget(entry.after_data);

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Audit Details"
            className="max-w-3xl"
            footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
        >
            <div className="flex flex-col gap-5">
                <div>
                    <p className="text-base font-semibold text-main">{entry.summary}</p>
                    <p className="mt-1 text-sm text-muted">{target}</p>
                </div>

                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-y border-line-muted py-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-subtle">When</dt><dd className="mt-0.5 font-medium text-main">{occurredAt(entry.occurred_at)}</dd></div>
                    <div><dt className="text-subtle">Actor</dt><dd className="mt-0.5 font-medium text-main">{entry.actor_name_snapshot}</dd></div>
                    <div><dt className="text-subtle">Event Type</dt><dd className="mt-0.5 font-medium text-main">{humanize(entry.event_type)}</dd></div>
                    <div><dt className="text-subtle">Entity</dt><dd className="mt-0.5 font-medium text-main">{humanize(entry.entity_type)}{entry.entity_id == null ? "" : ` #${entry.entity_id}`}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-subtle">Reason</dt><dd className="mt-0.5 font-medium text-main">{entry.reason || "No reason provided."}</dd></div>
                </dl>

                {entry.event_type === "permission.updated" ? (
                    <PermissionAuditDetails before={entry.before_data} after={entry.after_data} />
                ) : <div className="grid gap-4 md:grid-cols-2">
                    <SnapshotSection title="Changed from" snapshot={entry.before_data} />
                    <SnapshotSection title="Changed to" snapshot={entry.after_data} />
                </div>}
            </div>
        </Modal>
    );
};

export default AuditLogDetailsModal;
