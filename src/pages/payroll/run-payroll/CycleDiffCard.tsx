import Card from "../../../components/common/Card";

const fmt = (v: number) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const diff = (a: number, b: number) => {
    const d = a - b;
    const sign = d > 0 ? "+" : "";
    const color = d > 0 ? "#10b981" : d < 0 ? "#ef4444" : "#94a3b8";
    return <span style={{ color, fontSize: "11px", fontWeight: 600 }}>{sign}{fmt(d)}</span>;
};

// CycleDiffCard compares this run against the previous cycle. It renders nothing when there is no previous cycle to compare with.
const CycleDiffCard = ({ diffData }) => {
    if (!diffData?.has_previous || !diffData.current || !diffData.previous) return null;

    const cur = diffData.current;
    const prv = diffData.previous;
    const rows = [
        { label: "Employees", cur: cur.employee_count, prv: prv.employee_count, prefix: "" },
        { label: "Net Pay (฿)", cur: cur.net_pay, prv: prv.net_pay, prefix: "฿" },
        { label: "Total Earning (฿)", cur: cur.total_earning, prv: prv.total_earning, prefix: "฿" },
        { label: "Deductions (฿)", cur: cur.total_deduction, prv: prv.total_deduction, prefix: "฿" },
        { label: "SSO (฿)", cur: cur.sso_amount, prv: prv.sso_amount, prefix: "฿" },
    ];

    return (
        <Card style={{ marginBottom: "20px", padding: "16px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                เปรียบเทียบกับรอบที่แล้ว · {prv.cycle_name}
            </div>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ color: "#94a3b8", fontWeight: 600, fontSize: "11px" }}>
                            <th style={{ textAlign: "left", padding: "4px 8px 8px 0" }}></th>
                            <th style={{ textAlign: "right", padding: "4px 8px 8px" }}>{prv.cycle_name}</th>
                            <th style={{ textAlign: "right", padding: "4px 8px 8px" }}>{cur.cycle_name}</th>
                            <th style={{ textAlign: "right", padding: "4px 0 8px 8px" }}>เปลี่ยน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.label} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "7px 8px 7px 0", color: "#475569" }}>{r.label}</td>
                                <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: "monospace", color: "#94a3b8" }}>{r.prefix}{fmt(r.prv)}</td>
                                <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{r.prefix}{fmt(r.cur)}</td>
                                <td style={{ textAlign: "right", padding: "7px 0 7px 8px", fontFamily: "monospace" }}>{diff(r.cur, r.prv)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default CycleDiffCard;
