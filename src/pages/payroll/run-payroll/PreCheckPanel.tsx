// PreCheckPanel shows what the pre-check found and, when the run is still pending, lets the operator proceed anyway or back out.
const PreCheckPanel = ({ issues, pendingCalculate, onProceed, onDismiss }) => {
    if (issues.length === 0) return null;

    return (
        <div style={{
            marginTop: "12px", padding: "14px 16px",
            borderRadius: "8px", backgroundColor: "#fffbeb",
            border: "1px solid #fcd34d",
        }}>
            <div style={{ fontWeight: "600", color: "#92400e", marginBottom: "8px", fontSize: "13px" }}>
                ⚠ Issues found before Run Payroll
            </div>
            {issues.map((issue, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "13px", color: "#78350f" }}>{issue.message}</div>
                    {issue.employees?.length > 0 && (
                        <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "#92400e" }}>
                            {issue.employees.map((name: string) => <li key={name}>{name}</li>)}
                        </ul>
                    )}
                </div>
            ))}
            {pendingCalculate && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                    <button
                        onClick={onProceed}
                        style={{
                            padding: "6px 14px", borderRadius: "6px", border: "1px solid #d97706",
                            background: "var(--accent-color)", color: "#fff", fontSize: "13px",
                            fontWeight: "600", cursor: "pointer",
                        }}
                    >
                        Proceed Anyway
                    </button>
                    <button
                        onClick={onDismiss}
                        style={{
                            padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border-muted)",
                            background: "#fff", color: "var(--text-body)", fontSize: "13px", cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default PreCheckPanel;
