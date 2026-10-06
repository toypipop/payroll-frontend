import { defineConfig } from "@playwright/test";
import { env } from "node:process";

const baseURL = env.E2E_BASE_URL ?? "http://localhost:5174";

if (!/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(baseURL)) {
    throw new Error("E2E_BASE_URL must be a local http URL.");
}

export default defineConfig({
    testDir: "./browser-tests",
    outputDir: "./browser-tests/.artifacts",
    fullyParallel: false,
    workers: 1,
    reporter: [["list"]],
    use: {
        baseURL,
        headless: false,
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
    },
});
