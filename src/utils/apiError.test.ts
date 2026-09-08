import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { isCompanyInactiveError } from "./apiError";

describe("inactive company errors", () => {
    it("identifies the company conflict without treating other conflicts as inactive", () => {
        const inactive = new AxiosError();
        inactive.response = { status: 409, data: { code: "COMPANY_INACTIVE" } } as AxiosError["response"];
        expect(isCompanyInactiveError(inactive)).toBe(true);
        inactive.response!.data = { code: "OTHER_CONFLICT" };
        expect(isCompanyInactiveError(inactive)).toBe(false);
        expect(isCompanyInactiveError(new Error("COMPANY_INACTIVE"))).toBe(false);
    });
});
