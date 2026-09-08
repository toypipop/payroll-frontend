import { useMemo } from "react";

import { moduleKeysFromTree } from "../contexts/moduleTree";
import { useModules } from "./useModules";

// Checks whether the current user can access a module, walking the same /modules tree the sidebar is built from.
export const useModulePermission = (moduleKey: string): boolean => {
    const { modules } = useModules();
    return useMemo(() => moduleKeysFromTree(modules).has(moduleKey), [moduleKey, modules]);
};

export default useModulePermission;
