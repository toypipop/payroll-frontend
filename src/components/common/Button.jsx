import React from "react";

const Button = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    style = {},
}) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);

    const variants = {
        primary: {
            backgroundColor: "#6259ca",
            color: "#ffffff",
            border: "none",
        },
        danger: {
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "none",
        },
        ghost: {
            backgroundColor: "transparent",
            color: "#6259ca",
            border: "1px solid var(--border-color)",
        },
    };

    const defaultStyle = {
        padding: "9px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        letterSpacing: "0.01em",
        lineHeight: "1",
        transition: "all 0.15s ease",
        ...variants[variant],
        ...style,
    };

    const hoverStyle =
        variant === "primary"
            ? { backgroundColor: "#5148b2" }
            : variant === "danger"
            ? { backgroundColor: "#fecaca" }
            : { backgroundColor: "#f0effe", borderColor: "#a78bfa", color: "#6259ca" };

    return (
        <button
            type={type}
            onClick={onClick}
            style={{
                ...defaultStyle,
                ...(isHovered ? hoverStyle : {}),
                ...(isActive ? { transform: "scale(0.98)", opacity: 0.9 } : {}),
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsActive(false);
            }}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
        >
            {children}
        </button>
    );
};

export default Button;
