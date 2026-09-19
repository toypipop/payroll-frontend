import { useCallback, useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { apiErrorMessage } from "../utils/apiError";
import type { Pagination, ServerTableState, SortState } from "../types/api";

interface Query {
    endpoint: string | null;
    page: number;
    search: string;
    sort: SortState;
}

// One request owns one page. A changed endpoint resets the query immediately;
// cancellation and the request key prevent old responses appearing in a new cycle.
export function usePagedResource<R extends { pagination: Pagination }>(endpoint: string | null, sortKey: string | null = null, sortOrder: SortState["order"] = null) {
    const initial = useCallback((): Query => ({ endpoint, page: 1, search: "", sort: { key: sortKey, order: sortOrder } }), [endpoint, sortKey, sortOrder]);
    const [query, setQuery] = useState<Query>(initial);
    const active = query.endpoint === endpoint ? query : initial();
    if (query.endpoint !== endpoint) setQuery(active);
    const [revision, setRevision] = useState(0);
    const [response, setResponse] = useState<{ key: string; data?: R; error: string | null } | null>(null);
    const pageSize = 25;
    const params = { page: active.page, page_size: pageSize, search: active.search.trim(), sort: active.sort.key ?? "", order: active.sort.order ?? "asc" };
    const key = JSON.stringify([endpoint, params, revision]);

    useEffect(() => {
        if (!endpoint) return;
        const controller = new AbortController();
        // Coalesce rapid changes while a search term is being entered.
        const timer = window.setTimeout(() => {
            void api.get<R>(endpoint, { params: { page: active.page, page_size: pageSize, search: active.search.trim(), sort: active.sort.key ?? "", order: active.sort.order ?? "asc" }, signal: controller.signal })
                .then(({ data }) => { if (!controller.signal.aborted) setResponse({ key, data, error: null }); })
                .catch((error: unknown) => { if (!controller.signal.aborted) setResponse({ key, error: apiErrorMessage(error, "Unable to load records. Please retry.") }); });
        }, active.search ? 300 : 0);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [endpoint, active.page, active.search, active.sort.key, active.sort.order, key]);

    const update = useCallback((patch: Partial<Query>) => setQuery((current) => ({ ...(current.endpoint === endpoint ? current : initial()), ...patch })), [endpoint, initial]);
    const refresh = useCallback(() => setRevision((value) => value + 1), [setRevision]);
    const current = response?.key === key ? response : null;
    const data = endpoint ? current?.data : undefined;
    const table: ServerTableState = {
        page: data?.pagination.page ?? active.page,
        pageSize,
        total: data?.pagination.total ?? 0,
        search: active.search,
        sort: active.sort,
        loading: Boolean(endpoint && !current),
        error: current?.error ?? null,
        onPageChange: (page) => update({ page }),
        onSearchChange: (search) => update({ search, page: 1 }),
        onSortChange: (sort) => update({ sort, page: 1 }),
        onRetry: refresh,
    };
    return { data, table, refresh };
}
