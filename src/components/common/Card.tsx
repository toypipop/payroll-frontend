import { twMerge } from "tailwind-merge";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    style?: CSSProperties;
}

// The className carries the look; callers still pass `style` for one-off padding or layout overrides.
const Card = ({ children, style, className = "", ...props }: CardProps) => (
    <div
        className={twMerge(
            "overflow-hidden rounded-[10px] border border-[#e8edf2] bg-card px-6 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]",
            className,
        )}
        style={style}
        {...props}
    >
        {children}
    </div>
);

export default Card;
