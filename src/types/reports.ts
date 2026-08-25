// What each report endpoint answers with. Every report shares the same envelope — the cycle it covers,
// the company it belongs to, its rows, and its totals — so the page only has to name which rows it reads.

import type { ApiId, PayrollCycle, PayrollTransaction } from "./api";

// The company block a printed report puts in its header.
export interface ReportCompany {
    id?: ApiId;
    name?: string;
    address?: string;
    tax_id?: string;
    phone?: string;
}

interface ReportEnvelope {
    cycle?: PayrollCycle | null;
    company?: ReportCompany | null;
}

// GET /reports/bank-transfer/:cycle_id
export interface BankTransferRow {
    employees_id?: ApiId;
    employees_code?: string;
    first_name?: string;
    last_name?: string;
    bank_name?: string;
    account_no?: string;
    account_name?: string;
    net_pay: number;
    companies_name?: string;
}

export interface BankTransferReport extends ReportEnvelope {
    rows?: BankTransferRow[];
    total_net_pay?: number;
}

// GET /reports/tax-forms/pnd1/:cycle_id
export interface PND1Row {
    employees_code?: string;
    first_name?: string;
    last_name?: string;
    gross_income: number;
    sso_amount: number;
    tax_withheld: number;
    companies_name?: string;
}

export interface PND1Report extends ReportEnvelope {
    rows?: PND1Row[];
    total_gross?: number;
    total_tax?: number;
    total_sso?: number;
}

// GET /reports/tax-forms/50tawi/:transaction_id — one employee's withholding certificate.
export interface Tawi50Report extends ReportEnvelope {
    transaction?: PayrollTransaction | null;
}

// GET /reports/sso/:cycle_id
export interface SSORow {
    employees_code?: string;
    first_name?: string;
    last_name?: string;
    wages: number;
    employee_sso: number;
    employer_sso: number;
    companies_name?: string;
}

export interface SSOReport extends ReportEnvelope {
    rows?: SSORow[];
    sso_rate?: number;
    sso_max?: number;
    total_employee_sso?: number;
    total_employer_sso?: number;
    total_sso_combined?: number;
}

// GET /reports/payroll-analysis/:cycle_id — the register plus the journal it posts to.
export interface JournalEntry {
    account: string;
    debit: number;
    credit: number;
}

export interface AnalysisSummary {
    total_gross?: number;
    total_other_deductions?: number;
    total_sso_employee?: number;
    total_sso_employer?: number;
    total_tax?: number;
    total_net?: number;
}

export interface PayrollAnalysisReport extends ReportEnvelope {
    transactions?: PayrollTransaction[];
    summary?: AnalysisSummary;
    journal?: JournalEntry[];
}

// GET /reports/payslip/:transaction_id
export interface PayslipReport extends ReportEnvelope {
    slip?: PayrollTransaction | null;
}
