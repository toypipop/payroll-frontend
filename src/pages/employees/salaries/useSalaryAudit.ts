import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { ApiId } from "../../../types/api";
import type { SalaryAuditEntry } from "../../../types/domain";

// useSalaryAudit loads one employee's change log while the history modal is open. It is a separate call from
// the timeline because the two answer different questions: the timeline is what the salary is, the trail is
// how it got that way — including changes to records that no longer exist.
export const useSalaryAudit = (employeesID: ApiId | undefined) => {
    const [entries, setEntries] = useState<SalaryAuditEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!employeesID) {
            setEntries([]);
            return;
        }

        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await api.get<SalaryAuditEntry[]>(`/salaries/audit/${employeesID}`);
                if (!cancelled) setEntries(Array.isArray(res.data) ? res.data : []);
            } catch {
                // The trail is context, not the point of the screen: failing to load it leaves the timeline usable.
                if (!cancelled) setEntries([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [employeesID]);

    return { entries, loading };
};
