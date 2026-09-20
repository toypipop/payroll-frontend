import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { usePagedResource } from "../../../hooks/usePagedResource";
import type { EmployeeOption, PageResponse } from "../../../types/api";
import type { Company, EarningType, Employee, EmployeeEarning } from "../../../types/domain";
import type { ApiId } from "../../../types/api";

// useEmployeeEarnings owns the page's server data: the assignments plus the three option lists the form cascades through.
export const useEmployeeEarnings = () => {
    const { data, table, refresh: fetchItems } = usePagedResource<PageResponse<EmployeeEarning>>("/employee-earnings");
    const items = data?.items ?? [];
    const [companies, setCompanies] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [earningTypes, setEarningTypes] = useState<EarningType[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            try {
                const [empRes, etRes, companyRes] = await Promise.all([
                    api.get<EmployeeOption[]>("/employees/options", { signal: controller.signal }),
                    api.get("/earning-types/options", { signal: controller.signal }).catch(() => ({ data: [] })),
                    api.get("/companies/options", { signal: controller.signal }),
                ]);
                if (controller.signal.aborted) return;
                setEmployees(empRes.data);
                setEarningTypes(etRes.data);
                setCompanies(companyRes.data);
            } catch (err) {
                if (!controller.signal.aborted) console.error("Fetch error:", err);
            }
        };

        void fetchData();
        return () => controller.abort();
    }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this assignment?")) return;
        try {
            await api.delete(`/employee-earnings/${id}`);
            fetchItems();
        } catch {
            alert("Delete failed");
        }
    };

    return { items, companies, employees, earningTypes, table, fetchItems, remove };
};

export default useEmployeeEarnings;
