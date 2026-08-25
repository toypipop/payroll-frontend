// The shapes the API actually returns, named after the backend models they mirror.
//
// Two rules keep these honest:
//   - Every field is optional. A list endpoint, an `/options` endpoint and a detail endpoint return
//     different subsets of the same row, and a required field here would be a lie on two of the three.
//   - Relations are the loaded shape or null, never `any`. `Preload` decides whether they arrive at all.
//
// A page that needs a field the API does not send will fail to compile here rather than render "undefined".

import type { ApiId } from "./api";

export interface Company {
    id?: ApiId;
    name?: string;
    tax_id?: string;
    address?: string;
    phone?: string;
    // Preloaded by the two settings pages that list a company alongside the config it holds.
    payroll_config?: PayrollConfig | null;
    attendance_config?: AttendanceConfig | null;
}

export interface DepartmentCategory {
    id?: ApiId;
    name?: string;
}

export interface Department {
    id?: ApiId;
    companies_id?: ApiId;
    dept_name?: string;
    category_id?: ApiId;
    companies?: Company | null;
    category?: DepartmentCategory | null;
}

export interface Position {
    id?: ApiId;
    companies_id?: ApiId;
    pos_name?: string;
    companies?: Company | null;
}

export interface Role {
    id?: ApiId;
    companies_id?: ApiId;
    roles_name?: string;
    description?: string;
    companies?: Company | null;
}

export interface Bank {
    id?: ApiId;
    bank_code?: string;
    bank_name?: string;
    swift_code?: string;
}

export interface WorkLocation {
    id?: ApiId;
    companies_id?: ApiId;
    name?: string;
    companies?: Company | null;
}

export interface LeaveTypeSetting {
    id?: ApiId;
    companies_id?: ApiId;
    name?: string;
    is_paid?: boolean;
    max_days_per_year?: number;
    companies?: Company | null;
}

export interface DayOff {
    id?: ApiId;
    companies_id?: ApiId;
    weekday?: number;
    name?: string;
    is_paid?: boolean;
    companies?: Company | null;
}

export interface Holiday {
    id?: ApiId;
    companies_id?: ApiId;
    date?: string;
    name?: string;
    is_paid?: boolean;
    companies?: Company | null;
}

export interface EmploymentType {
    id?: ApiId;
    companies_id?: ApiId;
    name?: string;
    description?: string;
    companies?: Company | null;
}

export interface SalariesStructure {
    id?: ApiId;
    // Optimistic lock: a write carries the version it read, and the server refuses it if the row has moved.
    version?: number;
    companies_id?: ApiId;
    employees_id?: ApiId;
    base_salaries?: number;
    effective_date?: string;
    is_active?: boolean;
    companies?: Company | null;
    employees?: Employee | null;
}

// GET /salaries/history/:id — one record plus whether it may still be erased.
export interface SalaryHistoryRow extends SalariesStructure {
    can_delete?: boolean;
}

export interface Employee {
    id?: ApiId;
    companies_id?: ApiId;
    employees_code?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    dept_id?: ApiId;
    pos_id?: ApiId;
    roles_id?: ApiId;
    employment_type_id?: ApiId | null;
    is_active?: boolean;
    bank_id?: ApiId | null;
    account_name?: string;
    account_no?: string;
    companies?: Company | null;
    department?: Department | null;
    position?: Position | null;
    roles?: Role | null;
    salaries_structure?: SalariesStructure | null;
    employment_type?: EmploymentType | null;
    bank?: Bank | null;
    company_access?: EmployeeCompanyAccess[];
}

export interface EmployeeCompanyAccess {
    id?: ApiId;
    employee_id?: ApiId;
    company_id?: ApiId;
    role_id?: ApiId;
    is_active?: boolean;
    employee?: Employee | null;
    company?: Company | null;
    role?: Role | null;
}

export interface EarningType {
    id?: ApiId;
    companies_id?: ApiId;
    name?: string;
    is_taxable?: boolean;
    is_sso?: boolean;
    is_permanent?: boolean;
    companies?: Company | null;
}

export interface DeductionType {
    id?: ApiId;
    companies_id?: ApiId;
    name?: string;
    is_tax_deductible?: boolean;
    is_sso_deductible?: boolean;
    companies?: Company | null;
}

export interface EmployeeEarning {
    id?: ApiId;
    companies_id?: ApiId;
    employees_id?: ApiId;
    earning_type_id?: ApiId;
    amount?: number;
    earning_type?: EarningType | null;
    employees?: Employee | null;
}

export interface EmployeeDeduction {
    id?: ApiId;
    companies_id?: ApiId;
    employees_id?: ApiId;
    deduction_type_id?: ApiId;
    amount?: number;
    deduction_type?: DeductionType | null;
    employees?: Employee | null;
}

export interface CycleEarning {
    id?: ApiId;
    companies_id?: ApiId;
    cycle_id?: ApiId;
    employees_id?: ApiId;
    earning_type_id?: ApiId;
    amount?: number;
    earning_type?: EarningType | null;
    employees?: Employee | null;
    payroll_cycle?: { id?: ApiId; cycle_name?: string } | null;
}

export interface CycleDeduction {
    id?: ApiId;
    companies_id?: ApiId;
    cycle_id?: ApiId;
    employees_id?: ApiId;
    deduction_type_id?: ApiId;
    amount?: number;
    deduction_type?: DeductionType | null;
    employees?: Employee | null;
    payroll_cycle?: { id?: ApiId; cycle_name?: string } | null;
}

export interface PayrollConfig {
    id?: ApiId;
    companies_id?: ApiId;
    sso_rate?: number;
    sso_max_amount?: number;
    sso_min_salary?: number;
    tax_calculation?: string;
    companies?: Company | null;
}

export interface AttendanceConfig {
    id?: ApiId;
    companies_id?: ApiId;
    late_rate_per_minute?: number;
    absent_rate_per_day?: number;
    is_late_deduction_enabled?: boolean;
    is_absent_deduction_enabled?: boolean;
    work_start_time?: string | null;
    work_end_time?: string | null;
    overtime_rate_per_minute?: number;
    extra_rate_per_day?: number;
    is_overtime_earnings_enabled?: boolean;
    is_extra_earnings_enabled?: boolean;
    companies?: Company | null;
}

// GET /timelogs/schedule-config — the working hours a time-log form may see, deliberately without the
// payroll rates that live on the full AttendanceConfig.
export interface ScheduleConfig {
    companies_id?: ApiId;
    work_start_time?: string;
    work_end_time?: string;
    is_configured?: boolean;
}

export interface TimeLog {
    id?: ApiId;
    companies_id?: ApiId;
    employees_id?: ApiId;
    check_in?: string | null;
    check_out?: string | null;
    status?: string;
    work_location_id?: ApiId | null;
    location_in?: string;
    remark?: string;
    employees?: Employee | null;
    work_location?: WorkLocation | null;
}

export interface LeaveRequest {
    id?: ApiId;
    companies_id?: ApiId;
    employees_id?: ApiId;
    leave_type_id?: ApiId | null;
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    total_days?: number;
    reason?: string;
    status?: string;
    approved_by?: ApiId | null;
    employees?: Employee | null;
    approver?: Employee | null;
    leave_type_master?: LeaveTypeSetting | null;
    // Added by the approvals list so a reviewer sees the quota before approving.
    quota_max_days?: number;
    quota_used_days?: number;
    quota_exceeded?: boolean;
}

// The two attendance summary endpoints answer with the same envelope over a different row.
// Every figure is present on every row — the handler builds them from totals, so none of them is optional.
interface SummaryRowBase {
    employees_id: ApiId;
    employees_code: string;
    full_name: string;
    company_name: string;
    total_amount: number;
}

export interface DeductionSummaryRow extends SummaryRowBase {
    total_late_minutes: number;
    total_absent_days: number;
    late_amount: number;
    absent_amount: number;
}

export interface EarningSummaryRow extends SummaryRowBase {
    total_overtime_minutes: number;
    total_extra_days: number;
    overtime_amount: number;
    extra_amount: number;
}

export interface SummaryResponse<T> {
    summary: T[];
    from: string;
    to: string;
}

// What a `/options` endpoint returns: the minimum a dropdown needs, never a rate or anything sensitive.
export interface OptionRow {
    id?: ApiId;
    name?: string;
    companies_id?: ApiId;
}
