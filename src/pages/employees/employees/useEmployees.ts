import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Bank, Company, Department, Employee, EmploymentType, OptionRow, Position, Role } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useEmployees owns the page's server data: the employee rows plus every master list the form cascades through.
export const useEmployees = () => {
    const { data, table, refresh: fetchEmployees } = usePagedResource<PageResponse<Employee>>("/employees");
    const employees = data?.items ?? [];
    const loading = table.loading;
    const [masterDepts, setMasterDepts] = useState<OptionRow[]>([]);
    const [masterPos, setMasterPos] = useState<OptionRow[]>([]);
    const [masterRoles, setMasterRoles] = useState<OptionRow[]>([]);
    const [masterCompanies, setMasterCompanies] = useState<OptionRow[]>([]);
    const [masterBanks, setMasterBanks] = useState<OptionRow[]>([]);
    const [masterEmploymentTypes, setMasterEmploymentTypes] = useState<OptionRow[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, posRes, rolesRes, empTypesRes, banksRes, compRes] = await Promise.all([
                    api.get("/departments/options").catch(() => ({ data: [] })),
                    api.get("/positions/options").catch(() => ({ data: [] })),
                    api.get("/roles/options").catch(() => ({ data: [] })),
                    api.get("/master/employment-types/options").catch(() => ({ data: [] })),
                    api.get("/master/banks/options").catch(() => ({ data: [] })),
                    api.get("/companies/options").catch(() => ({ data: [] })),
                ]);
                setMasterBanks((banksRes.data || []).map((b: Bank) => ({ id: b.id, name: `${b.bank_code} — ${b.bank_name}` })));
                setMasterEmploymentTypes(
                    (empTypesRes.data || []).map((t: EmploymentType) => ({
                        id: t.id,
                        name: t.name,
                        companies_id: t.companies_id,
                    })),
                );
                setMasterCompanies((compRes.data || []).map((c: Company) => ({ id: c.id, name: c.name })));

                // Check property names from API match your Backend JSON response (English Comment)
                setMasterDepts(
                    // The /options endpoints answer with `name`; the full records use their own column name.
                    (deptRes.data as (Department & OptionRow)[]).map((d) => ({
                        id: d.id,
                        name: d.dept_name || d.name,
                        companies_id: d.companies_id,
                    })),
                );
                setMasterPos(
                    (posRes.data as (Position & OptionRow)[]).map((p) => ({
                        id: p.id,
                        name: p.pos_name || p.name,
                        companies_id: p.companies_id,
                    })),
                );
                setMasterRoles(
                    (rolesRes.data as (Role & OptionRow)[]).map((r) => ({
                        id: r.id,
                        name: r.roles_name || r.name,
                        companies_id: r.companies_id,
                    })),
                );
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMasterData();
    }, []);

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure you want to delete this employees?")) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return {
        employees, loading, fetchEmployees, remove, table,
        masterDepts, masterPos, masterRoles, masterCompanies, masterBanks, masterEmploymentTypes,
    };
};

export default useEmployees;
