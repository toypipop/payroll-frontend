import { describe, expect, it } from "vitest";
import source from "./AuditLogsPage.tsx?raw";

describe("Audit Logs row actions", () => {
    it("opens details through an explicit Details button rather than the whole row", () => {
        expect(source).toContain('label: "Actions"');
        expect(source).toContain('>Details</Button>');
        expect(source).not.toContain("onRowClick={setSelectedEntry}");
    });
});
