import type { CSSProperties, ReactNode } from "react";

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
    // Preloaded on the run and transactions tables, which show where the employee sits today.
    department?: { dept_name?: string } | null;
    position?: { pos_name?: string } | null;
    bank?: { bank_name?: string } | null;
    account_no?: string;
    account_name?: string;
    [key: string]: unknown;
}

export interface PayrollTransaction {
    id?: ApiId;
    // When the run last wrote this row — what tells a reader how old the figures on an open cycle are.
    updated_at?: string;
    cycle_id?: ApiId;
    employees_id?: ApiId;
    employees?: PayrollEmployee | null;
    employee?: PayrollEmployee | null;
    salaries_at_time?: number;
    net_pay?: number;
    total_earning?: number;
    total_deduction?: number;
    sso_amount?: number;
    taxable_income?: number;
    tax_amount?: number;
    // Snapshotted at calculation time, so a closed payslip still reads correctly after the employee moves on.
    position_name?: string;
    department_name?: string;
    employment_type_name?: string;
    bank_name?: string;
    bank_account_name?: string;
    bank_account_no?: string;
    details?: PayrollTransactionDetail[];
    [key: string]: unknown;
}

// One line of a payroll transaction: the earnings and deductions that explain the totals.
export interface PayrollTransactionDetail {
    id?: ApiId;
    item_name?: string;
    amount?: number;
    type?: "earning" | "deduction";
    is_tax_relevant?: boolean;
    earning_type_id?: ApiId | null;
    deduction_type_id?: ApiId | null;
}

export interface PayrollTransactionsResponse {
    transactions?: PayrollTransaction[];
    cycle?: PayrollCycle | null;
}

// POST /payroll/calculate/:cycle_id — what the run covered.
export interface PayrollRunResult {
    message?: string;
    cycle_id?: ApiId;
    processed_count?: number;
    skipped_count?: number;
    skipped_employees?: string[];
    prorated_employees?: { name: string; days: number; total_days: number }[];
}

// GET /payroll/precheck/:cycle_id — what would be skipped or missing if the cycle ran now.
export interface PreCheckIssue {
    type: string;
    message?: string;
    employees?: string[];
}

export interface PreCheckResponse {
    ok: boolean;
    issues: PreCheckIssue[];
}

// GET /payroll/diff/:cycle_id — this cycle's totals against the company's previous closed one.
export interface CycleSummary {
    cycle_id?: ApiId;
    cycle_name?: string;
    employee_count?: number;
    total_earning?: number;
    total_deduction?: number;
    sso_amount?: number;
    tax_amount?: number;
    net_pay?: number;
}

export interface CycleDiff {
    current: CycleSummary;
    previous: CycleSummary | null;
    has_previous: boolean;
}

// GET /payroll/my-slips — one closed-cycle payslip of the signed-in employee.
export interface MySlip extends PayrollTransaction {
    cycle_name?: string;
    start_date?: string;
    end_date?: string;
}

// GET /payroll/slip/:transaction_id
export interface PayslipResponse {
    cycle?: PayrollCycle | null;
    slip?: PayrollTransaction | null;
    company?: { id?: ApiId; name?: string; address?: string; tax_id?: string } | null;
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

// A column is generic over the row it renders, and the row only has to be an object: the domain types the
// pages pass in are plain interfaces, so requiring TableRow's index signature would shut every one of them out.
export interface TableColumn<T extends object = TableRow> {
    label?: ReactNode;
    key?: string;
    sortKey?: string;
    sortable?: boolean;
    searchable?: boolean;
    searchableKeys?: string[];
    render?: (row: T, rowIndex: number) => ReactNode;
    sortValue?: (row: T) => unknown;
    searchValue?: (row: T) => unknown;
    // CSSProperties rather than a string map: the report tables pass real style objects, and a map would
    // reject a perfectly valid `textAlign` the moment one branch of a conditional leaves a key out.
    headerStyle?: CSSProperties;
    cellStyle?: CSSProperties | ((row: T, rowIndex: number) => CSSProperties);
}
