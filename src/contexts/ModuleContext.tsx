import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import api from "../api/axiosInstance";
import type { AppModule, UserProfile } from "../types/api";
import { ModuleContext } from "./moduleContextValue";

interface ModuleProviderProps {
    user: UserProfile | null;
    children: ReactNode;
}

// ModuleProvider owns the session-only copy of /modules/mine. Every consumer shares
// the same in-flight request and receives one consistent route/menu capability tree.
export const ModuleProvider = ({ user, children }: ModuleProviderProps) => {
    const [modules, setModules] = useState<AppModule[]>([]);
    const [loading, setLoading] = useState(Boolean(user));
    const currentUserID = String(user?.id ?? "");
    const activeUserIDRef = useRef(currentUserID);
    const inFlightRef = useRef<{ userID: string; request: Promise<void> } | null>(null);

    const refreshModules = useCallback(async () => {
        const userID = currentUserID;
        if (!userID) {
            setModules([]);
            setLoading(false);
            return;
        }
        if (inFlightRef.current?.userID === userID) return inFlightRef.current.request;

        const request = api.get<AppModule[]>("/modules/mine")
            .then((response) => {
                if (activeUserIDRef.current === userID) setModules(response.data);
            })
            .catch(() => {
                // Fail closed: no module routes or navigation are shown if capability loading fails.
                if (activeUserIDRef.current === userID) setModules([]);
            })
            .finally(() => {
                if (activeUserIDRef.current === userID) setLoading(false);
                if (inFlightRef.current?.request === request) inFlightRef.current = null;
            });
        inFlightRef.current = { userID, request };
        return request;
    }, [currentUserID]);

    useEffect(() => {
        activeUserIDRef.current = currentUserID;
        const refreshTimer = window.setTimeout(() => {
            void refreshModules();
        }, 0);
        return () => window.clearTimeout(refreshTimer);
    }, [currentUserID, refreshModules]);

    return <ModuleContext.Provider value={{ modules, loading, refreshModules }}>{children}</ModuleContext.Provider>;
};

export default ModuleProvider;
