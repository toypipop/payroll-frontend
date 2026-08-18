import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    style?: CSSProperties;
}

// Hover and press used to be React state; they are now `hover:` and `active:` variants, so the button re-renders for nothing no more.
const VARIANTS: Record<ButtonVariant, string> = {
    primary:   "border-0 bg-control text-card hover:bg-primary-hover",
    danger:    "border-0 bg-[#fee2e2] text-danger-text hover:bg-[#fecaca]",
    secondary: "border border-line bg-surface text-body hover:border-line-input hover:bg-hover",
    ghost:     "border border-line bg-transparent text-control hover:border-control-line hover:bg-control-soft",
};

const BASE =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold leading-none tracking-[0.01em] " +
    "transition-all duration-150 cursor-pointer active:scale-[0.98] active:opacity-90 " +
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const Button = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    style,
    disabled,
    className = "",
    ...props
}: ButtonProps) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={twMerge(BASE, VARIANTS[variant], className)}
        style={style}
        {...props}
    >
        {children}
    </button>
);

export default Button;
