import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useAuth } from "../../hooks/useAuth";
import useDashboardStats from "./stats/useDashboardStats";
import { TONE_TEXT, TONE_SOFT_BG, TONE_BG, TONE_BORDER_HOVER } from "../../components/common/tone";
import type { Tone } from "../../components/common/tone";

interface StatCardProps {
    label: string;
    value?: number | string;
    sub?: string;
    tone?: Tone;
    loading?: boolean;
}

const StatCard = ({ label, value, sub, tone = 'neutral', loading }: StatCardProps) => (
    <Card className="flex-1 min-w-[150px]">
        <div className="text-[10px] font-bold text-subtle uppercase tracking-[0.08em]">
            {label}
        </div>
        <div className={`mt-1.5 text-[28px] font-extrabold leading-none tabular-nums ${TONE_TEXT[tone]}`}>
            {loading ? <span className="text-[13px] text-line-input">&mdash;</span> : value}
        </div>
        {sub && <div className="text-[11px] text-subtle mt-[5px]">{sub}</div>}
    </Card>
);

// A quick link's tone drives its colours, so it names one rather than carrying a colour.
const quickLinks: { label: string; desc: string; path: string; tone: Tone }[] = [
    { label: 'Run Payroll',   desc: 'Calculate & process a new cycle',   path: '/run-payroll',   tone: 'brand' },
    { label: 'Employees',    desc: 'Manage employee records',            path: '/employees',     tone: 'brand' },
    { label: 'Payslips',     desc: 'Browse closed-cycle payslips',       path: '/payslips',      tone: 'success' },
    { label: 'Transactions', desc: 'Audit immutable payroll records',    path: '/transactions',  tone: 'accent' },
];

const DashboardPage = () => {
    const navigate = useNavigate();
    const { stats, loading } = useDashboardStats();
    const { user: storedUser } = useAuth();

    return (
        <>
            <PageHeader title="Dashboard" />

            {/* Welcome banner */}
            <div className="bg-card rounded-[10px] p-[22px_28px] mb-[18px] flex justify-between items-center border border-line-muted shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                <div>
                    <div className="text-subtle text-[12px] mb-[4px]">Welcome back,</div>
                    <div className="text-main text-[20px] font-extrabold">
                        {storedUser?.fullName || 'Administrator'}
                    </div>
                    <div className="text-subtle text-[12px] mt-[5px]">
                        {new Date().toLocaleDateString('en-GB', { timeZone: "Asia/Bangkok", weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                <Badge status="active">System Active</Badge>
            </div>

            {/* Stats row */}
            <div className="flex gap-[14px] mb-[24px] flex-wrap">
                <StatCard label="Total Employees" value={stats?.employees  ?? 0} sub="Across all departments" tone="neutral" loading={loading} />
                <StatCard label="Payroll Cycles"  value={stats?.totalCycles ?? 0} sub="All time"              tone="neutral" loading={loading} />
                <StatCard label="Active Cycles"   value={stats?.activeCycles ?? 0} sub="Open for processing" tone="brand" loading={loading} />
                <StatCard label="Closed Cycles"   value={stats?.closedCycles ?? 0} sub="Locked & immutable"  tone="success" loading={loading} />
            </div>

            {/* Quick access */}
            <div className="text-[10px] font-bold text-subtle uppercase tracking-[0.08em] mb-[12px]">
                Quick Access
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
                {quickLinks.map(({ label, desc, path, tone }) => (
                    <div
                        key={path}
                        onClick={() => navigate(path)}
                        className={`cursor-pointer rounded-[10px] border border-line-light bg-white p-[18px_20px] transition-[border-color,box-shadow] duration-150 hover:shadow-[0_4px_14px_rgba(15,23,42,0.10)] ${TONE_BORDER_HOVER[tone]}`}
                    >
                        <div className={`mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-lg ${TONE_SOFT_BG[tone]}`}>
                            <div className={`h-3 w-3 rounded-[3px] ${TONE_BG[tone]}`} />
                        </div>
                        <div className="font-bold text-[14px] text-main">{label}</div>
                        <div className="text-[12px] text-subtle mt-[3px] leading-[1.4]">{desc}</div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default DashboardPage;
