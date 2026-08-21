import React from "react";
import type { InputHTMLAttributes } from "react";

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: unknown;
}

// Use forwardRef for React Hook Form
const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
    ({ label, error, id, checked, onChange, ...props }, ref) => (
        <div className="mt-3 flex flex-col gap-1 px-1">
            <label className="flex cursor-pointer items-center gap-2.5">
                <input
                    type="checkbox"
                    id={id}
                    ref={ref}
                    checked={checked}
                    onChange={onChange}
                    className="h-[18px] w-[18px] cursor-pointer accent-success"
                    {...props}
                />
                <span className="cursor-pointer text-sm font-medium text-secondary">{label}</span>
            </label>
            {error && <span className="mt-0.5 text-xs text-danger">{String(error)}</span>}
        </div>
    ),
);

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
