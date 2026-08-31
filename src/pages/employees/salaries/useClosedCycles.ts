import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { PayrollCycleOption } from "../../../types/api";

// useClosedCycles loads the payroll calendar the salary forms warn against. It reads the /options sibling
// rather than /payroll/cycles, which is gated on the Payroll Cycles page: a user may well be allowed to
// adjust a salary without being allowed to open that page, and they are exactly who the warning is for.
export const useClosedCycles = (enabled: boolean) => {
    const [cycles, setCycles] = useState<PayrollCycleOption[]>([]);

    useEffect(() => {
        if (!enabled) return;

        // A modal can close while this is in flight, so the response is dropped rather than written.
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get<PayrollCycleOption[]>("/payroll/cycles/options");
                if (!cancelled) setCycles(Array.isArray(res.data) ? res.data : []);
            } catch {
                // The warning is advisory — the server still refuses a bad date with 409 — so a failure
                // here leaves the form usable instead of blocking it.
                if (!cancelled) setCycles([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return cycles;
};
