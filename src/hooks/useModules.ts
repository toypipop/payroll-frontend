import { useContext } from "react";

import { ModuleContext } from "../contexts/moduleContextValue";

export const useModules = () => {
    const context = useContext(ModuleContext);
    if (!context) throw new Error("useModules must be used within ModuleProvider");
    return context;
};

export default useModules;
