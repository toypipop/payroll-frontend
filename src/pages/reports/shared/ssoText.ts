import type { SSOReport } from "../../../types/reports";

// Normalize only text fields, before padding/truncation. CRLF is one break;
// Unicode line separators and control characters must not create extra records.
const padText = (value: string | number, width: number): string =>
    String(value || "").replace(/\r\n|[\p{Cc}\u2028\u2029]/gu, " ").padEnd(width).slice(0, width);

// Retain the existing numeric layout and rounding in this export.
const padNumber = (value: number, width: number): string =>
    String(value || "").padStart(width).slice(-width);

export const formatSSOText = ({ company, cycle, rows = [] }: SSOReport): string => {
    const lines = rows.map((row, index) => [
        padText(index + 1, 5),
        padText(row.employees_code ?? "", 15),
        padText(`${row.first_name} ${row.last_name}`, 40),
        padNumber(Math.round(row.wages * 100), 12),
        padNumber(Math.round(row.employee_sso * 100), 10),
        padNumber(Math.round(row.employer_sso * 100), 10),
    ].join(""));

    const header = [
        padText("SSO E-FILING", 80),
        padText(`COMPANY: ${company?.name}`, 80),
        padText(`TAX ID: ${company?.tax_id}`, 80),
        padText(`PERIOD: ${cycle?.cycle_name}`, 80),
        padText("", 80),
        padText("SEQ  EMP_CODE        EMPLOYEE_NAME                           WAGES        EMP_SSO   EMPR_SSO", 80),
    ];
    return [...header, ...lines].join("\r\n");
};
