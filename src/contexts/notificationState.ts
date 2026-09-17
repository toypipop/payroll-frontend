import { createContext } from "react";

export interface NotificationContextValue {
    showError: (detail: string, requestID?: string | null) => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);
