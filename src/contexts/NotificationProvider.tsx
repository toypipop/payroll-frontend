import { CircleAlert, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { TONE_SOFT_BG, TONE_TEXT_STRONG } from "../components/common/tone";
import { NotificationContext } from "./notificationState";

interface ErrorNotification {
    id: string;
    detail: string;
    requestID: string | null;
}

const notificationID = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const ErrorToast = ({ notification, dismiss }: { notification: ErrorNotification; dismiss: () => void }) => {
    useEffect(() => {
        const timeout = window.setTimeout(dismiss, 7000);
        return () => window.clearTimeout(timeout);
    }, [dismiss]);

    return (
        <article className="pointer-events-auto flex w-full max-w-sm gap-3 rounded-xl border border-danger-line bg-card p-4 shadow-card" role="alert">
            <CircleAlert aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${TONE_TEXT_STRONG.danger}`} />
            <div className="min-w-0 flex-1">
                <p className={`font-semibold ${TONE_TEXT_STRONG.danger}`}>Something went wrong</p>
                <p className="mt-1 text-sm text-body">{notification.detail}</p>
                {notification.requestID && (
                    <p className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs ${TONE_SOFT_BG.danger} ${TONE_TEXT_STRONG.danger}`}>
                        Reference ID: {notification.requestID}
                    </p>
                )}
            </div>
            <button type="button" onClick={dismiss} className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-main" aria-label="Dismiss error notification">
                <X aria-hidden="true" className="size-4" />
            </button>
        </article>
    );
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

    const dismiss = useCallback((id: string) => {
        setNotifications((current) => current.filter((notification) => notification.id !== id));
    }, []);

    const showError = useCallback((detail: string, requestID: string | null = null) => {
        const id = notificationID();
        setNotifications((current) => [...current, { id, detail, requestID }]);
    }, []);

    useEffect(() => {
        const onUnexpectedApiError = (event: Event) => {
            const detail = (event as CustomEvent<{ message?: string; requestID?: string | null }>).detail;
            showError(detail?.message ?? "Unable to complete the request.", detail?.requestID);
        };
        window.addEventListener("api-error", onUnexpectedApiError);
        return () => window.removeEventListener("api-error", onUnexpectedApiError);
    }, [showError]);

    return (
        <NotificationContext.Provider value={{ showError }}>
            {children}
            <section className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3" aria-live="polite" aria-label="Notifications">
                {notifications.map((notification) => <ErrorToast key={notification.id} notification={notification} dismiss={() => dismiss(notification.id)} />)}
            </section>
        </NotificationContext.Provider>
    );
};
