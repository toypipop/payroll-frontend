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
    disabled,
    ...props
}: ButtonProps) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);

    const variants: Record<ButtonVariant, CSSProperties> = {
        primary: {
            backgroundColor: "var(--control-accent)",
            color: "var(--bg-card)",
            borderWidth: "0",
            borderStyle: "solid",
            borderColor: "transparent",
        },
        danger: {
            backgroundColor: "#fee2e2",
            color: "var(--status-danger-text)",
            borderWidth: "0",
            borderStyle: "solid",
            borderColor: "transparent",
        },
        secondary: {
            backgroundColor: "var(--surface-subtle)",
            color: "var(--text-body)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--border-color)",
        },
        ghost: {
            backgroundColor: "transparent",
            color: "var(--control-accent)",
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
            ? { backgroundColor: "var(--surface-hover)", borderColor: "var(--border-input)" }
            : { backgroundColor: "var(--control-accent-soft)", borderColor: "var(--control-accent-line)", color: "var(--control-accent)" };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                ...defaultStyle,
                ...(disabled
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : isHovered
                    ? hoverStyle
                    : {}),
                ...(isActive && !disabled ? { transform: "scale(0.98)", opacity: 0.9 } : {}),
            }}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsActive(false);
            }}
            onMouseDown={() => !disabled && setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
