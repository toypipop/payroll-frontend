import { describe, expect, it } from "vitest";
import source from "./TransactionDetailsModal.tsx?raw";

describe("Transaction Details statutory withholding badges", () => {
    it("labels SSO and Income Tax as statutory in the yellow warning badge", () => {
        expect(source).toContain('row.item_name === "Social Security (SSO)" || row.item_name === "Income Tax"');
        expect(source).toContain('<Badge status="pending">Statutory</Badge>');
    });
});
