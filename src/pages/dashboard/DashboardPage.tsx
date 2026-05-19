import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const StatCard = ({ label, value, sub, color = '#0f172a', loading }) => (
    <Card style={{ flex: 1, minWidth: '150px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {label}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color, marginTop: '6px', lineHeight: '1', fontVariantNumeric: 'tabular-nums' }}>
            {loading ? <span style={{ fontSize: '13px', color: '#cbd5e1' }}>&mdash;</span> : value}
        </div>
        {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>{sub}</div>}
    </Card>
);

const quickLinks = [
    { label: 'Run Payroll',   desc: 'Calculate & process a new cycle',   path: '/run-payroll',   color: '#3b82f6' },
    { label: 'Employees',    desc: 'Manage employee records',            path: '/employees',     color: '#8b5cf6' },
    { label: 'Payslips',     desc: 'Browse closed-cycle payslips',       path: '/payslips',      color: '#10b981' },
    { label: 'Transactions', desc: 'Audit immutable payroll records',    path: '/transactions',  color: '#f59e0b' },
];

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const load = async () => {
            try {
                const [empRes, cycleRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/payroll/cycles'),
                ]);
                const cycles = cycleRes.data || [];
                setStats({
                    employees:    (empRes.data || []).length,
                    totalCycles:  cycles.length,
                    activeCycles: cycles.filter(c => !c.is_closed).length,
                    closedCycles: cycles.filter(c =>  c.is_closed).length,
                });
            } catch {
                setStats({ employees: 0, totalCycles: 0, activeCycles: 0, closedCycles: 0 });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <>
            <PageHeader title="Dashboard" />

            {/* Welcome banner */}
            <div style={{
                background: '#ffffff',
                borderRadius: '10px',
                padding: '22px 28px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            }}>
                <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Welcome back,</div>
                    <div style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>
                        {storedUser.fullName || 'Administrator'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '5px' }}>
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                <Badge status="active">System Active</Badge>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <StatCard label="Total Employees" value={stats?.employees  ?? 0} sub="Across all departments" color="#0f172a" loading={loading} />
                <StatCard label="Payroll Cycles"  value={stats?.totalCycles ?? 0} sub="All time"              color="#0f172a" loading={loading} />
                <StatCard label="Active Cycles"   value={stats?.activeCycles ?? 0} sub="Open for processing" color="#3b82f6" loading={loading} />
                <StatCard label="Closed Cycles"   value={stats?.closedCycles ?? 0} sub="Locked & immutable"  color="#10b981" loading={loading} />
            </div>

            {/* Quick access */}
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Quick Access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                {quickLinks.map(({ label, desc, path, color }) => (
                    <div
                        key={path}
                        onClick={() => navigate(path)}
                        style={{
                            backgroundColor: '#fff',
                            border: '1px solid #e8edf2',
                            borderRadius: '10px',
                            padding: '18px 20px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
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
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{label}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px', lineHeight: '1.4' }}>{desc}</div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default DashboardPage;
