import type { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    status?: string | boolean | number;
}

// Each status maps to a Tailwind pair rather than a style object, so the pill picks up hover/dark variants for free later.
const STATUS_CLASSES: Record<string, string> = {
    active:    "bg-[#ecfdf5] text-success",
    true:      "bg-[#ecfdf5] text-success",
    approved:  "bg-[#ecfdf5] text-success",
    inactive:  "bg-[#fef2f2] text-danger",
    false:     "bg-[#fef2f2] text-danger",
    rejected:  "bg-[#fef2f2] text-danger",
    cancelled: "bg-hover text-subtle",
    pending:   "bg-[#fffbeb] text-accent",
    default:   "bg-hover text-muted",
};

const Badge = ({ children, status = "default" }: BadgeProps) => {
    const tone = STATUS_CLASSES[String(status).toLowerCase()] || STATUS_CLASSES.default;

    return (
        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>
            {children}
        </span>
    );
};

export default Badge;
