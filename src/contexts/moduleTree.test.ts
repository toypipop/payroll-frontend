import { describe, expect, it } from "vitest";

import { flattenModulePages, moduleKeysFromTree } from "./moduleTree";

describe("moduleTree", () => {
    const modules = [
        {
            id: 1,
            module_key: "General",
            module_name: "General",
            is_category: true,
            children: [
                { id: 2, module_key: "DashboardPage", module_name: "Dashboard", route_path: "/dashboard" },
            ],
        },
    ];

    it("keeps only routable leaf modules when building routes", () => {
        expect(flattenModulePages(modules)).toEqual([modules[0].children![0]]);
    });

    it("collects module keys from categories and leaves", () => {
        expect(moduleKeysFromTree(modules)).toEqual(new Set(["General", "DashboardPage"]));
    });
});
