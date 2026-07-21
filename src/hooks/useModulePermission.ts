import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

interface ModuleNode {
    module_key?: string;
    children?: ModuleNode[];
}

const collectKeys = (items: ModuleNode[] | undefined, keys: Set<string>) => {
    (items || []).forEach((m) => {
        if (m.module_key) keys.add(m.module_key);
        if (m.children) collectKeys(m.children, keys);
    });
};

/**
 * Checks whether the current user can access a given module (page), by
 * walking the same /modules tree the sidebar is built from. Used to decide
 * whether to show a "Set it up" link to a settings page the caller may not
 * have permission to visit.
 */
export const useModulePermission = (moduleKey: string): boolean => {
    const [canAccess, setCanAccess] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api
            .get("/modules/mine")
            .then((res) => {
                if (cancelled) return;
                const keys = new Set<string>();
                collectKeys(res.data, keys);
                setCanAccess(keys.has(moduleKey));
            })
            .catch(() => {
                if (!cancelled) setCanAccess(false);
            });

        return () => {
            cancelled = true;
        };
    }, [moduleKey]);

    return canAccess;
};

export default useModulePermission;
