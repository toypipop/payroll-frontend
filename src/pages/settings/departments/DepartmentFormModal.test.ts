import { describe, expect, it } from "vitest";
import source from "./DepartmentFormModal.tsx?raw";

describe("Department form payload", () => {
    it("converts the selected company id to a number before the create request", () => {
        expect(source).toContain("companies_id: Number(data.companies_id)");
    });
});
