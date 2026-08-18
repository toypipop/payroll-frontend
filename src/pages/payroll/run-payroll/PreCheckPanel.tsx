// PreCheckPanel shows what the pre-check found and, when the run is still pending, lets the operator proceed anyway or back out.
const PreCheckPanel = ({ issues, pendingCalculate, onProceed, onDismiss }) => {
    if (issues.length === 0) return null;

    return (
        <div className="mt-[12px] p-[14px_16px] rounded-[8px] bg-[#fffbeb] border border-[#fcd34d]">
            <div className="font-semibold text-[#92400e] mb-[8px] text-[13px]">
                ⚠ Issues found before Run Payroll
            </div>
            {issues.map((issue, i) => (
                <div key={i} className="mb-[8px]">
                    <div className="text-[13px] text-[#78350f]">{issue.message}</div>
                    {issue.employees?.length > 0 && (
                        <ul className="m-[4px_0_0_16px] p-[0px] text-[12px] text-[#92400e]">
                            {issue.employees.map((name: string) => <li key={name}>{name}</li>)}
                        </ul>
                    )}
                </div>
            ))}
            {pendingCalculate && (
                <div className="mt-[10px] flex gap-[8px]">
                    <button
                        onClick={onProceed}
                        className="p-[6px_14px] rounded-[6px] border border-[#d97706] bg-accent text-[#fff] text-[13px] font-semibold cursor-pointer"
                    >
                        Proceed Anyway
                    </button>
                    <button
                        onClick={onDismiss}
                        className="p-[6px_14px] rounded-[6px] border border-line-muted bg-[#fff] text-body text-[13px] cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default PreCheckPanel;
