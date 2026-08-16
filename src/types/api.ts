import type { ReactNode } from "react";

export type ApiId = number | string;

export interface UserProfile {
    id: ApiId;
    fullName: string;
    roles: string[];
    companies_id?: ApiId | null;
    accessible_company_ids?: ApiId[];
}

export interface AuthMeResponse {
    id: ApiId;
    full_name: string;
    roles: string[];
    companies_id?: ApiId | null;
    accessible_company_ids?: ApiId[];
}

export interface AppModule {
    id: ApiId;
    module_id?: ApiId;
    module_key: string;
    module_name: string;
    route_path?: string | null;
    is_category?: boolean;
    children?: AppModule[];
    parent_id?: ApiId | null;
    order?: number;
    icon?: string;
    // What the backend can enforce for this module; the matrix is driven by these, never by a hardcoded frontend list.
    scope_level?: "company" | "employee";
    allowed_actions?: ("VIEW" | "CREATE" | "EDIT" | "DELETE")[];
    allowed_scopes?: ("Own" | "Department" | "Companies")[];
    actions_atomic?: boolean;
}

export interface PayrollCycle {
    id: ApiId;
    cycle_name?: string;
    cycle_code?: string;
    period_start?: string;
    period_end?: string;
    start_date?: string;
    end_date?: string;
    is_closed?: boolean;
    companies?: { name?: string } | null;
    [key: string]: unknown;
}

export interface PayrollEmployee {
    id?: ApiId;
    employees_code?: string;
    first_name?: string;
    last_name?: string;
    companies?: { name?: string } | null;
    [key: string]: unknown;
}

export interface PayrollTransaction {
    id?: ApiId;
    employees?: PayrollEmployee | null;
    employee?: PayrollEmployee | null;
    net_pay?: number;
    total_earning?: number;
    total_deduction?: number;
    [key: string]: unknown;
}

export interface PayrollTransactionsResponse {
    transactions?: PayrollTransaction[];
    cycle?: PayrollCycle | null;
}

export type SortOrder = "asc" | "desc";

export interface SortState {
    key: string | null;
    order: SortOrder | null;
}

export interface TableRow {
    id?: ApiId;
    module_id?: ApiId;
    [key: string]: unknown;
}

export interface TableColumn<T extends TableRow = TableRow> {
    label?: ReactNode;
    key?: string;
    sortKey?: string;
    sortable?: boolean;
    searchable?: boolean;
    searchableKeys?: string[];
    render?: (row: T, rowIndex: number) => ReactNode;
    sortValue?: (row: T) => unknown;
    searchValue?: (row: T) => unknown;
    headerStyle?: Record<string, string | number>;
    cellStyle?: Record<string, string | number> | ((row: T, rowIndex: number) => Record<string, string | number>);
}
