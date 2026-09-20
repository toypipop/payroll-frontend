import { useMemo } from "react";
import { useOptions } from "../../../hooks/useOptions";
import { usePagedResource } from "../../../hooks/usePagedResource";
import api from "../../../api/axiosInstance";
import type { Company, EmployeeCompanyAccess, OptionRow } from "../../../types/domain";
import type { ApiId, EmployeeOption, PageResponse } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useEmployeeCompanyAccess = () => {
    const { data, table, refresh: fetchAccessRows } = usePagedResource<PageResponse<EmployeeCompanyAccess>>("/employee-company-access");
    const { options: employeeOptions } = useOptions<EmployeeOption>("/employees/options");
    const { options: companies } = useOptions<Company>("/companies/options");
    const { options: roles } = useOptions<OptionRow>("/roles/options");
    const employees = useMemo(() => employeeOptions.map((employee) => ({
        id: employee.id, companies_id: employee.companies_id,
        name: `${employee.employees_code || "EMP"} - ${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
    })), [employeeOptions]);
    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this employee company access?")) return;
        try {
            await api.delete(`/employee-company-access/${id}`);
            fetchAccessRows();
        } catch (error) { alert(apiErrorMessage(error, "Delete failed")); }
    };
    return { accessRows: data?.items ?? [], employees, companies, roles, table, fetchAccessRows, remove };
};
export default useEmployeeCompanyAccess;
