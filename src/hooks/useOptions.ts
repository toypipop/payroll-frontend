import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

// Complete option sources are independent of a table's page/search state.
export function useOptions<T>(endpoint: string) {
    const [options, setOptions] = useState<T[]>([]);
    useEffect(() => {
        const controller = new AbortController();
        void api.get<T[]>(endpoint, { signal: controller.signal })
            .then(({ data }) => { if (!controller.signal.aborted) setOptions(data); })
            .catch(() => { if (!controller.signal.aborted) setOptions([]); });
        return () => controller.abort();
    }, [endpoint]);
    return { options, setOptions };
}
