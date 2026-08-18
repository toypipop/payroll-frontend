import type { ReactNode } from "react";

interface ToggleFieldProps {
    label?: ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

// The focus ring was applied by hand in onFocus/onBlur; it is a `focus-visible:` variant now.
const ToggleField = ({ label, checked, onChange, disabled = false }: ToggleFieldProps) => (
    <div className="mb-1 flex items-center justify-between py-2.5">
        <span className="text-[13px] font-medium text-body">{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={
                "relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full border-none p-0 outline-none transition-colors " +
                "focus-visible:shadow-[0_0_0_3px_rgba(15,118,110,0.2)] disabled:cursor-not-allowed " +
                (checked ? "bg-control" : "bg-line-input") +
                (disabled ? "" : " cursor-pointer")
            }
        >
            <span
                className={
                    "absolute h-4 w-4 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform " +
                    (checked ? "translate-x-[21px]" : "translate-x-[3px]")
                }
            />
        </button>
    </div>
);

export default ToggleField;
