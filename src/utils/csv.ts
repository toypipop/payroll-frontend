interface CsvDecimal {
    readonly kind: "decimal";
    readonly value: number;
}

export type CsvCell = string | number | null | undefined | CsvDecimal;

/** Mark accounting values as numbers so negative amounts remain numeric. */
export const csvDecimal = (value: number | null | undefined): CsvDecimal => ({
    kind: "decimal",
    value: value ?? 0,
});

// Check past leading whitespace, including controls and BOM, and include the
// full-width formula markers interpreted by some spreadsheet locales.
const FORMULA_PREFIX = /^[\s\p{Cc}]*[=+\-@＝＋－＠]/u;
const CONTROL_PREFIX = /^[\s\p{Cc}]*[\t\r\n]/u;

const serializeCell = (cell: CsvCell): string => {
    let value: string;
    if (typeof cell === "number" || (cell != null && typeof cell === "object")) {
        const number = typeof cell === "number" ? cell : cell.value;
        if (!Number.isFinite(number)) throw new TypeError("CSV numbers must be finite");
        value = typeof cell === "number" ? String(number) : number.toFixed(2);
    } else {
        value = cell ?? "";
        // Excel-oriented exports: the tab stays inside the quoted cell. Do not
        // use formula wrappers (e.g. ="00123") to preserve identifiers.
        if (FORMULA_PREFIX.test(value) || CONTROL_PREFIX.test(value)) value = `\t${value}`;
    }
    return `"${value.replace(/"/g, '""')}"`;
};

/** Serialize spreadsheet-facing CSV with UTF-8 BOM, quoted cells and CRLF rows. */
export const toSpreadsheetCsv = (rows: readonly (readonly CsvCell[])[]): string =>
    "\uFEFF" + rows.map((row) => row.map(serializeCell).join(",")).join("\r\n");
