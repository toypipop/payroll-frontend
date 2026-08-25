import type { PreCheckIssue } from "../../../types/api";

interface PreCheckPanelProps {
    issues: PreCheckIssue[];
    pendingCalculate: boolean;
    onProceed: () => void;
    onDismiss: () => void;
}

// PreCheckPanel shows what the pre-check found and, when the run is still pending, lets the operator proceed anyway or back out.
const PreCheckPanel = ({ issues, pendingCalculate, onProceed, onDismiss }: PreCheckPanelProps) => {
    if (issues.length === 0) return null;

    return (
        <div className="mt-[12px] p-[14px_16px] rounded-[8px] bg-warning-soft border border-warning-line">
            <div className="font-semibold text-warning-text mb-[8px] text-[13px]">
                ⚠ Issues found before Run Payroll
            </div>
            {issues.map((issue, i) => (
                <div key={i} className="mb-[8px]">
                    <div className="text-[13px] text-warning-text">{issue.message}</div>
                    {(issue.employees?.length ?? 0) > 0 && (
                        <ul className="m-[4px_0_0_16px] p-[0px] text-[12px] text-warning-text">
                            {issue.employees?.map((name: string) => <li key={name}>{name}</li>)}
                        </ul>
                    )}
                </div>
            ))}
            {pendingCalculate && (
                <div className="mt-[10px] flex gap-[8px]">
                    <button
                        onClick={onProceed}
                        className="p-[6px_14px] rounded-[6px] border border-warning-line bg-accent text-white text-[13px] font-semibold cursor-pointer"
                    >
                        Proceed Anyway
                    </button>
                    <button
                        onClick={onDismiss}
                        className="p-[6px_14px] rounded-[6px] border border-line-muted bg-white text-body text-[13px] cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default PreCheckPanel;
