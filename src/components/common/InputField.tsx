import { forwardRef } from "react";
import type { CSSProperties, InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: unknown;
    style?: CSSProperties;
    containerStyle?: CSSProperties;
    required?: boolean;
}

// The focus ring used to be set by hand in onFocus/onBlur; it is a `focus:` variant now, so the handlers only forward.
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    (
        {
            label,
            type = "text",
            placeholder,
            error,
            style, // Allow external style overrides
            containerStyle, // Allow overriding container-level styles
            required,
            className = "",
            ...props // This includes name, onChange, onBlur from register()
        },
        ref,
    ) => (
        <div className="mb-5 flex w-full flex-col gap-1.5" style={containerStyle}>
            {label && (
                <label className="text-[13px] font-medium text-muted">
                    {label}
                    {required && <span className="text-danger"> *</span>}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                placeholder={placeholder || `Enter ${label || ""}`}
                className={
                    "h-10 w-full rounded-lg border bg-surface px-3.5 font-[inherit] text-sm text-strong outline-none transition-colors " +
                    (error ? "border-danger" : "border-line-muted focus:border-control") +
                    ` ${className}`
                }
                style={style}
                {...props}
            />
            {error && <span className="mt-0.5 text-xs text-danger">{String(error)}</span>}
        </div>
    ),
);

// Setting displayName for easier debugging
InputField.displayName = "InputField";

export default InputField;
