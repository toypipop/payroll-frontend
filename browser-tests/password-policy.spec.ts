import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@admin.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "admin@admin.com";

async function loginAsMockAdmin(page: Page) {
    await page.goto("/");
    await page.getByPlaceholder("Email").fill(adminEmail);
    await page.getByPlaceholder("Password").fill(adminPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/dashboard");
}

async function openEmployeeForm(page: Page) {
    await page.getByRole("button", { name: "Employees" }).click();
    await page.getByRole("link", { name: "Employee List" }).click();
    await page.getByRole("button", { name: "+ Add Employees" }).click();
    await expect(page.getByText("Add New Employees", { exact: true })).toBeVisible();
}

async function selectOption(page: Page, field: string, option: string) {
    await page.locator(`select[name="${field}"] + div[role="button"]`).click();
    await page.locator("#select-portal-dropdown").getByText(option, { exact: true }).click();
}

test("employee password accepts 6 characters and rejects values outside 6–30", async ({ page }) => {
    await loginAsMockAdmin(page);
    await openEmployeeForm(page);

    const password = page.locator('input[name="password"]');
    const save = page.getByRole("button", { name: "Save" });

    await password.fill("short");
    await save.click();
    await expect(page.getByText("Password must be at least 6 characters", { exact: true })).toBeVisible();

    await password.fill("a".repeat(31));
    await save.click();
    await expect(page.getByText("Password must be at most 30 characters", { exact: true })).toBeVisible();

    const uniqueID = Date.now();
    const employeeCode = `E2E-PW-${uniqueID}`;
    await page.locator('input[name="employees_code"]').fill(employeeCode);
    await page.locator('input[name="first_name"]').fill("Browser");
    await page.locator('input[name="last_name"]').fill("Test");
    await page.locator('input[name="email"]').fill(`e2e-pw-${uniqueID}@example.test`);
    await password.fill("abcdef");
    await selectOption(page, "dept_id", "System IT");
    await selectOption(page, "pos_id", "System Admin");
    await selectOption(page, "roles_id", "STAFF");

    const createResponse = page.waitForResponse((response) =>
        response.url().includes("/api/v1/employees") && response.request().method() === "POST",
    );
    await save.click();
    expect((await createResponse).status()).toBe(201);
    await expect(page.getByText(employeeCode, { exact: true })).toBeVisible();
});
