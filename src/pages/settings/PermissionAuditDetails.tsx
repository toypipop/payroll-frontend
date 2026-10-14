import type { AuditSnapshot } from "./audit-log-details";
import { permissionAuditChanges } from "./permission-audit-details";

interface Props { before: AuditSnapshot; after: AuditSnapshot }

const PermissionAuditDetails = ({ before, after }: Props) => {
    const comparison = permissionAuditChanges(before, after);
    const complete = comparison.before.state === "recorded" && comparison.after.state === "recorded";
    return <section className="flex flex-col gap-4" aria-label="Permission changes">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["before", "after"] as const).map(side => <div key={side} className="rounded-xl border border-line-muted bg-surface p-4">
                <h4 className="text-sm font-semibold text-main">{side === "before" ? "Changed from" : "Changed to"}</h4>
                <dl className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <dt className="text-muted">Configured modules</dt>
                    <dd className="font-medium text-main">{comparison[side].count ?? "Not recorded"}</dd>
                </dl>
            </div>)}
        </div>
        <p className="text-sm text-muted">Counts include modules with all actions disabled. They are not the number of changes.</p>
        {(["before", "after"] as const).map(side => {
            const state = comparison[side].state;
            if (state === "recorded") return null;
            return <p key={side} className="text-sm text-muted">
                {side === "before" ? "Before" : "After"}: {state === "missing"
                    ? "detailed permissions were not recorded in this audit snapshot."
                    : "recorded permission details are invalid and cannot be compared reliably."}
            </p>;
        })}
        {complete && <p className="text-sm text-muted">{comparison.modules.length === 0
            ? "No permission changes recorded."
            : `${comparison.modules.length} module(s) changed. Unchanged settings are omitted.`}</p>}
        {comparison.modules.length > 0 && <p className="text-sm text-subtle">Modules are identified by the IDs stored in this audit event.</p>}
        {comparison.modules.map(module => <div key={module.id} className="overflow-hidden rounded-xl border border-line-muted bg-surface p-4">
            <table className="w-full table-fixed text-left text-sm">
                <caption className="mb-3 text-left font-semibold text-main">Module #{module.id}</caption>
                <thead><tr className="border-b border-line-muted text-muted">
                    <th scope="col" className="pb-2 pr-2 font-medium">Setting</th>
                    <th scope="col" className="pb-2 pr-2 font-medium">Before</th>
                    <th scope="col" className="pb-2 font-medium">After</th>
                </tr></thead>
                <tbody>{module.changes.map(change => <tr key={change.key} className="border-b border-line-muted last:border-0">
                    <th scope="row" className="break-words py-2 pr-2 font-medium text-main">{change.label}</th>
                    <td className="break-words py-2 pr-2 text-muted">{change.before}</td>
                    <td className="break-words py-2 font-medium text-main">{change.after}</td>
                </tr>)}</tbody>
            </table>
        </div>)}
    </section>;
};

export default PermissionAuditDetails;
