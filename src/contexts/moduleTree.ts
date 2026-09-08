import type { AppModule } from "../types/api";

export const flattenModulePages = (modules: AppModule[]): AppModule[] => {
    const pages: AppModule[] = [];
    const collect = (items: AppModule[]) => {
        items.forEach((item) => {
            if (item.route_path && !item.is_category) pages.push(item);
            if (item.children?.length) collect(item.children);
        });
    };
    collect(modules);
    return pages;
};

export const moduleKeysFromTree = (modules: AppModule[]): Set<string> => {
    const keys = new Set<string>();
    const collect = (items: AppModule[]) => {
        items.forEach((item) => {
            if (item.module_key) keys.add(item.module_key);
            if (item.children?.length) collect(item.children);
        });
    };
    collect(modules);
    return keys;
};
