import { describe, expect, it } from "vitest";
import { csvDecimal, toSpreadsheetCsv } from "./csv";

describe("spreadsheet CSV", () => {
    it.each([
        "=1+1", "+SUM(A1:A2)", "-1+2", "@SUM(A1:A2)",
        " =1+1", "\t=1+1", "\r=1+1", "\n=1+1", "\uFEFF=1+1", "\u0000=1+1",
        "＝1+1", "＋1+1", "－1+1", "＠SUM(A1:A2)",
        "\tplain", "\rplain", "\nplain",
    ])("neutralizes untrusted prefix %j inside a single quoted cell", (value) => {
        expect(toSpreadsheetCsv([[value]])).toBe(`\uFEFF"\t${value}"`);
    });

    it("escapes delimiter/quote injection without creating extra cells", () => {
        expect(toSpreadsheetCsv([['=1+1",=2+2', "next"]]))
            .toBe('\uFEFF"\t=1+1"",=2+2","next"');
        expect(toSpreadsheetCsv([['ชื่อ, "สมชาย";=1+1']]))
            .toBe('\uFEFF"ชื่อ, ""สมชาย"";=1+1"');
    });

    it("keeps identifiers and Thai text intact in CSV without formula wrappers", () => {
        expect(toSpreadsheetCsv([["001234567890", "0007", "สมชาย ใจดี", "WFH"]]))
            .toBe('\uFEFF"001234567890","0007","สมชาย ใจดี","WFH"');
    });

    it("distinguishes negative accounting values from untrusted text", () => {
        expect(toSpreadsheetCsv([[1, csvDecimal(-123.45), "-123.45", csvDecimal(10), csvDecimal(null)]]))
            .toBe('\uFEFF"1","-123.45","\t-123.45","10.00","0.00"');
    });

    it("uses one BOM, CRLF rows, empty cells and safe quoted multiline text", () => {
        expect(toSpreadsheetCsv([["Header", null], ["one\ntwo", undefined], ["TOTAL", csvDecimal(1.5)]]))
            .toBe('\uFEFF"Header",""\r\n"one\ntwo",""\r\n"TOTAL","1.50"');
    });

    it.each([NaN, Infinity, -Infinity])("rejects non-finite numbers %s", (value) => {
        expect(() => toSpreadsheetCsv([[value]])).toThrow("CSV numbers must be finite");
        expect(() => toSpreadsheetCsv([[csvDecimal(value)]])).toThrow("CSV numbers must be finite");
    });
});
