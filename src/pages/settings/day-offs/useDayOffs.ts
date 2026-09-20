import { usePagedResource } from "../../../hooks/usePagedResource";
import type { PageResponse } from "../../../types/api";
import { useOptions } from "../../../hooks/useOptions";
import type { Company, DayOff } from "../../../types/domain";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

export const weekdayOptions = [
    { id: "0", name: "Sunday" },
    { id: "1", name: "Monday" },
    { id: "2", name: "Tuesday" },
    { id: "3", name: "Wednesday" },
    { id: "4", name: "Thursday" },
    { id: "5", name: "Friday" },
    { id: "6", name: "Saturday" },
];

export const weekdayName = (value: unknown) => weekdayOptions.find((o) => String(o.id) === String(value))?.name || "-";

export const useDayOffs = () => {
    const { data, table, refresh: fetchData } = usePagedResource<PageResponse<DayOff>>("/master/day-offs");
    const items = data?.items ?? [];
    const { options: companyOptions } = useOptions<Company>("/master/day-offs/companies");

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Delete this day off?")) return;
        try {
            await api.delete(`/master/day-offs/${id}`);
            fetchData();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return { items, table, fetchData, companyOptions, remove };
};

export default useDayOffs;
