import { createContext } from "react";

import type { AppModule } from "../types/api";

export interface ModuleContextValue {
    modules: AppModule[];
    loading: boolean;
    refreshModules: () => Promise<void>;
}

export const ModuleContext = createContext<ModuleContextValue | null>(null);
