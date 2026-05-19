import React from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    style?: CSSProperties;
}

const Button = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    style = {},
    ...props
}: ButtonProps) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);

    const variants: Record<ButtonVariant, CSSProperties> = {
        primary: {
            backgroundColor: "#6259ca",
            color: "#ffffff",
            borderWidth: "0",
            borderStyle: "solid",
            borderColor: "transparent",
        },
        danger: {
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderWidth: "0",
            borderStyle: "solid",
            borderColor: "transparent",
        },
        secondary: {
            backgroundColor: "#f8fafc",
            color: "#475569",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--border-color)",
        },
        ghost: {
            backgroundColor: "transparent",
            color: "#6259ca",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--border-color)",
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
            : variant === "secondary"
            ? { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }
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
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
