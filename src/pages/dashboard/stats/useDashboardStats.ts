import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Employee } from "../../../types/domain";
import type { PageResponse, PayrollCycle } from "../../../types/api";

// The four figures the dashboard shows.
export interface DashboardStats {
    employees: number;
    totalCycles: number;
    activeCycles: number;
    closedCycles: number;
}

// useDashboardStats reads from two modules the viewer may not both have, which is why a refused source counts as zero rather than blanking the page.
export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // allSettled, not all: the dashboard reads from two modules the viewer may not both have.
            const [empRes, cycleRes] = await Promise.allSettled([
                api.get<PageResponse<Employee>>('/employees', { params: { page_size: 1 } }),
                api.get('/payroll/cycles'),
            ]);

            const employeeCount = empRes.status === 'fulfilled' ? empRes.value.data.pagination.total : 0;
            const cycles: PayrollCycle[] = cycleRes.status === 'fulfilled' ? (cycleRes.value.data || []) : [];

            setStats({
                employees:    employeeCount,
                totalCycles:  cycles.length,
                activeCycles: cycles.filter(c => !c.is_closed).length,
                closedCycles: cycles.filter(c =>  c.is_closed).length,
            });
            setLoading(false);
        };
        load();
    }, []);

    return { stats, loading };
};

export default useDashboardStats;
