import React from "react";

const Badge = ({ children, status = "default" }) => {
    // 1. Map various status types to internal colors (English Comment)
    const statusColors = {
        active: { bg: "#ecfdf5", text: "#10b981" }, // Green
        true: { bg: "#ecfdf5", text: "#10b981" }, // Support boolean true
        inactive: { bg: "#fef2f2", text: "#ef4444" }, // Red
        false: { bg: "#fef2f2", text: "#ef4444" }, // Support boolean false
        pending: { bg: "#fffbeb", text: "#f59e0b" }, // Yellow
        default: { bg: "#f1f5f9", text: "#64748b" }, // Slate
    };

    // 2. Convert status to string for safe mapping (English Comment)
    const statusKey = String(status).toLowerCase();
    const colors = statusColors[statusKey] || statusColors.default;

    const styles = {
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
        },
    };

    return <span style={styles.badge}>{children}</span>;
};

export default Badge;
