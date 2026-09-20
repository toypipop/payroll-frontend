import { getLatestSalaryStructure, getSalaryRecordId } from "./salaryShape";
import type { SalaryPayload } from "./salaryShape";
import type { Employee } from "../../../types/domain";
export type SalaryRow = Employee & { __salary: SalaryPayload; __salary_id: number; __recent_sort: number };
export function salaryRows(rows: SalaryPayload[]): SalaryRow[] {
    return rows.map((row) => {
        const latest = getLatestSalaryStructure(row);
        const latestBag = latest as Record<string, unknown> | null;
        const updatedAt = (latestBag?.updated_at || latestBag?.created_at || null) as string | null;
        const latestId = getSalaryRecordId(latest, row);
        const recentSort = updatedAt ? new Date(updatedAt).getTime() : latestId;
        return {
            ...(row as Employee),
            __salary: latest,
            __salary_id: latestId,
            __recent_sort: Number.isNaN(recentSort) ? latestId : recentSort,
        };
    });

}
