import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useAuth } from "../../hooks/useAuth";
import useDashboardStats from "./stats/useDashboardStats";

const StatCard = ({ label, value, sub, color = 'var(--text-main)', loading }) => (
    <Card className="flex-1 min-w-[150px]">
        <div className="text-[10px] font-bold text-subtle uppercase tracking-[0.08em]">
            {label}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color, marginTop: '6px', lineHeight: '1', fontVariantNumeric: 'tabular-nums' }}>
            {loading ? <span className="text-[13px] text-line-input">&mdash;</span> : value}
        </div>
        {sub && <div className="text-[11px] text-subtle mt-[5px]">{sub}</div>}
    </Card>
);

const quickLinks = [
    { label: 'Run Payroll',   desc: 'Calculate & process a new cycle',   path: '/run-payroll',   color: '#3b82f6' },
    { label: 'Employees',    desc: 'Manage employee records',            path: '/employees',     color: '#8b5cf6' },
    { label: 'Payslips',     desc: 'Browse closed-cycle payslips',       path: '/payslips',      color: 'var(--status-success)' },
    { label: 'Transactions', desc: 'Audit immutable payroll records',    path: '/transactions',  color: 'var(--accent-color)' },
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
                        {storedUser.fullName || 'Administrator'}
                    </div>
                    <div className="text-subtle text-[12px] mt-[5px]">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                <Badge status="active">System Active</Badge>
            </div>

            {/* Stats row */}
            <div className="flex gap-[14px] mb-[24px] flex-wrap">
                <StatCard label="Total Employees" value={stats?.employees  ?? 0} sub="Across all departments" color="var(--text-main)" loading={loading} />
                <StatCard label="Payroll Cycles"  value={stats?.totalCycles ?? 0} sub="All time"              color="var(--text-main)" loading={loading} />
                <StatCard label="Active Cycles"   value={stats?.activeCycles ?? 0} sub="Open for processing" color="#3b82f6" loading={loading} />
                <StatCard label="Closed Cycles"   value={stats?.closedCycles ?? 0} sub="Locked & immutable"  color="var(--status-success)" loading={loading} />
            </div>

            {/* Quick access */}
            <div className="text-[10px] font-bold text-subtle uppercase tracking-[0.08em] mb-[12px]">
                Quick Access
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
                {quickLinks.map(({ label, desc, path, color }) => (
                    <div
                        key={path}
                        onClick={() => navigate(path)}
                        className="bg-[#fff] border border-[#e8edf2] rounded-[10px] p-[18px_20px] cursor-pointer transition-[border-color_0.15s,_box-shadow_0.15s]"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = color;
                            e.currentTarget.style.boxShadow = `0 4px 14px ${color}22`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e8edf2';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '8px',
                            backgroundColor: `${color}1a`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '12px',
                        }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
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
