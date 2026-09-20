import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, Department, DepartmentCategory } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const useDepartments = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<Department>>("/departments");
    const departments = data?.items ?? [];
    const { options: companies } = useOptions<Company>("/companies/options");
    const { options: categories, setOptions: setCategories } = useOptions<DepartmentCategory>("/department-categories");

    const remove = async (id?: ApiId) => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        try {
            await api.delete(`/departments/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { departments, table, fetchData, companies, categories, setCategories, remove };
};

export default useDepartments;
