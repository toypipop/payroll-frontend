import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { CycleEmployeeOption } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";

interface OptionsState {
    cycleId: string;
    employees: CycleEmployeeOption[];
    loading: boolean;
    error: string;
}

// The modal's cycle drives eligibility, including when it differs from the page filter.
export default function useCycleEmployeeOptions(cycleId: string, isOpen: boolean) {
    const [state, setState] = useState<OptionsState>({
        cycleId: "", employees: [], loading: false, error: "",
    });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const fetchOptions = async () => {
            setState({ cycleId, employees: [], loading: !!cycleId && isOpen, error: "" });
            if (!isOpen || !cycleId) return;
            try {
                const response = await api.get<CycleEmployeeOption[]>(
                    `/payroll/cycles/${cycleId}/employees/options`,
                    { signal: controller.signal },
                );
                if (!controller.signal.aborted) {
                    setState({ cycleId, employees: response.data, loading: false, error: "" });
                }
            } catch (error: unknown) {
                if (!controller.signal.aborted) {
                    setState({
                        cycleId, employees: [], loading: false,
                        error: apiErrorMessage(error, "Could not load employees for this cycle."),
                    });
                }
            }
        };
        void fetchOptions();
        return () => controller.abort();
    }, [cycleId, isOpen, attempt]);

    const current = isOpen && state.cycleId === cycleId;
    return {
        employees: current ? state.employees : [],
        loading: !!cycleId && isOpen && (!current || state.loading),
        error: current ? state.error : "",
        reload: () => setAttempt((value) => value + 1),
    };
}
