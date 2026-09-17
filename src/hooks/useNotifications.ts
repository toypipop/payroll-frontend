import { useContext } from "react";
import { NotificationContext, type NotificationContextValue } from "../contexts/notificationState";

export const useNotifications = (): NotificationContextValue => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
    return context;
};
