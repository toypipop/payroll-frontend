import Card from "../../../components/common/Card";

const fmt = (v: number) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const diff = (a: number, b: number) => {
    const d = a - b;
    const sign = d > 0 ? "+" : "";
    const color = d > 0 ? "var(--status-success)" : d < 0 ? "var(--status-danger)" : "var(--text-subtle)";
    return <span className="text-[11px] font-semibold" style={{ color }}>{sign}{fmt(d)}</span>;
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
        <Card className="mb-5 px-5 py-4">
            <div className="text-[11px] font-bold text-subtle uppercase tracking-[0.06em] mb-[12px]">
                เปรียบเทียบกับรอบที่แล้ว · {prv.cycle_name}
            </div>
            <div className="overflow-x-auto">
                <table className="w-[100%] border-collapse text-[13px]">
                    <thead>
                        <tr className="text-subtle font-semibold text-[11px]">
                            <th className="text-left p-[4px_8px_8px_0]"></th>
                            <th className="text-right p-[4px_8px_8px]">{prv.cycle_name}</th>
                            <th className="text-right p-[4px_8px_8px]">{cur.cycle_name}</th>
                            <th className="text-right p-[4px_0_8px_8px]">เปลี่ยน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.label} className="border-t border-t-hover">
                                <td className="p-[7px_8px_7px_0] text-body">{r.label}</td>
                                <td className="text-right p-[7px_8px] font-mono text-subtle">{r.prefix}{fmt(r.prv)}</td>
                                <td className="text-right p-[7px_8px] font-mono font-semibold text-main">{r.prefix}{fmt(r.cur)}</td>
                                <td className="text-right p-[7px_0_7px_8px] font-mono">{diff(r.cur, r.prv)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default CycleDiffCard;
