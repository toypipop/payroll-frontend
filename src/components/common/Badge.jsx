import React from "react";

const Badge = ({ children, status = "default" }) => {
    const statusColors = {
        active: { bg: "#ecfdf5", text: "#10b981" },
        true: { bg: "#ecfdf5", text: "#10b981" },
        approved: { bg: "#ecfdf5", text: "#10b981" }, 
        inactive: { bg: "#fef2f2", text: "#ef4444" },
        false: { bg: "#fef2f2", text: "#ef4444" },
        rejected: { bg: "#fef2f2", text: "#ef4444" },
        cancelled: { bg: "#f1f5f9", text: "#94a3b8" },
        pending: { bg: "#fffbeb", text: "#f59e0b" },
        default: { bg: "#f1f5f9", text: "#64748b" },
    };

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
            whiteSpace: "nowrap",
        },
    };

    return <span style={styles.badge}>{children}</span>;
};

export default Badge;