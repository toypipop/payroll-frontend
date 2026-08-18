import React from "react";
import type { CSSProperties, ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    status?: string | boolean | number;
}

const Badge = ({ children, status = "default" }: BadgeProps) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
        active: { bg: "#ecfdf5", text: "var(--status-success)" },
        true: { bg: "#ecfdf5", text: "var(--status-success)" },
        approved: { bg: "#ecfdf5", text: "var(--status-success)" }, 
        inactive: { bg: "#fef2f2", text: "var(--status-danger)" },
        false: { bg: "#fef2f2", text: "var(--status-danger)" },
        rejected: { bg: "#fef2f2", text: "var(--status-danger)" },
        cancelled: { bg: "var(--surface-hover)", text: "var(--text-subtle)" },
        pending: { bg: "#fffbeb", text: "var(--accent-color)" },
        default: { bg: "var(--surface-hover)", text: "var(--text-muted)" },
    };

    const statusKey = String(status).toLowerCase();
    const colors = statusColors[statusKey] || statusColors.default;

    const styles: Record<string, CSSProperties> = {
        badge: {
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 12px",
            borderRadius: "99px",
            fontSize: "12px",
            fontWeight: "600",
            backgroundColor: colors.bg,
            color: colors.text,
            textTransform: "capitalize",
            whiteSpace: "nowrap",
        },
    };

    return <span style={styles.badge}>{children}</span>;
};

export default Badge;
