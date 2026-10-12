import { describe, expect, it } from "vitest";
import { formatSSOText } from "./ssoText";
import type { SSOReport } from "../../../types/reports";

const report: SSOReport = {
    company: { name: "บริษัทตัวอย่าง", tax_id: "0123456789012" },
    cycle: { id: 1, cycle_name: "October" },
    rows: [{ employees_code: "0007", first_name: "สมชาย", last_name: "ใจดี", wages: 12345.67, employee_sso: 750, employer_sso: 750 }],
};

describe("SSO text export", () => {
    it("preserves Thai names, leading zeros and the existing numeric layout", () => {
        const lines = formatSSOText(report).split("\r\n");
        expect(lines).toHaveLength(7);
        expect(lines.slice(0, 6).every((line) => line.length === 80)).toBe(true);
        expect(lines[6]).toHaveLength(92);
        expect(lines[6].slice(5, 20).trim()).toBe("0007");
        expect(lines[6].slice(20, 60).trim()).toBe("สมชาย ใจดี");
        expect(lines[6].slice(60, 72)).toBe("     1234567");
        expect(lines[6].slice(72, 82)).toBe("     75000");
        expect(lines[6].slice(82, 92)).toBe("     75000");
    });

    it.each(["\r\n", "\r", "\n", "\t", "\u0000", "\u001b", "\u007f", "\u0085", "\u2028", "\u2029"])(
        "neutralizes record/control injection %j in every exported text field", (control) => {
            const output = formatSSOText({
                ...report,
                company: { name: `A${control}B`, tax_id: `0${control}1` },
                cycle: { id: 1, cycle_name: `C${control}D` },
                rows: [{ ...report.rows![0], employees_code: `E${control}F`, first_name: `G${control}H`, last_name: `I${control}J` }],
            });
            const lines = output.split("\r\n");
            expect(lines).toHaveLength(7);
            expect(lines.slice(0, 6).every((line) => line.length === 80)).toBe(true);
            expect(lines[6]).toHaveLength(92);
            expect(lines[1].trim()).toBe("COMPANY: A B");
            expect(lines[2].trim()).toBe("TAX ID: 0 1");
            expect(lines[3].trim()).toBe("PERIOD: C D");
            expect(lines[6].slice(5, 20).trim()).toBe("E F");
            expect(lines[6].slice(20, 60).trim()).toBe("G H I J");
            expect(lines[6].slice(60)).toBe(formatSSOText(report).split("\r\n")[6].slice(60));
        },
    );

    it("keeps the record count with long injected text and multiple employees", () => {
        const row = { ...report.rows![0], first_name: "สมชาย\n".repeat(100) };
        const lines = formatSSOText({ ...report, rows: [row, row] }).split("\r\n");
        expect(lines).toHaveLength(8);
        expect(lines.slice(6).every((line) => line.length === 92 && !line.includes("\n"))).toBe(true);
    });
});
