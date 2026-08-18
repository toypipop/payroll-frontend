import { twMerge } from "tailwind-merge";
import React, { forwardRef, useState, useCallback } from "react";
import type { ChangeEvent, CSSProperties, InputHTMLAttributes } from "react";

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label?: string;
    error?: unknown;
    style?: CSSProperties;
    containerClassName?: string;
    containerStyle?: CSSProperties;
    value?: string | number;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
    (
        {
            label,
            placeholder,
            error,
            style,
            containerStyle,
            containerClassName = "",
            value,
            onChange,
            required,
            className = "",
            ...props
        },
        ref,
    ) => {
        const [internalValue, setInternalValue] = useState(value ?? "");
        const isControlled = value !== undefined;

        const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const numeric = raw.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1");
            if (!isControlled) {
                setInternalValue(numeric);
            }
            if (onChange) {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: numeric },
                    nativeEvent: e.nativeEvent,
                    preventDefault: () => e.preventDefault(),
                    stopPropagation: () => e.stopPropagation(),
                };
                onChange(syntheticEvent);
            }
        }, [isControlled, onChange]);

        const displayValue = isControlled ? String(value ?? "") : internalValue;

        return (
            <div className={twMerge("mb-5 flex w-full flex-col gap-1.5", containerClassName)} style={containerStyle}>
                {label && (
                    <label className="text-[13px] font-medium text-muted">
                        {label}
                        {required && <span className="text-danger"> *</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder || `Enter ${label || ""}`}
                    value={displayValue}
                    onChange={handleChange}
                    className={twMerge(
                        "box-border h-10 w-full rounded-lg border bg-surface px-3.5 font-[inherit] text-sm text-strong outline-none transition-colors",
                        error ? "border-danger" : "border-line-muted focus:border-control",
                        className,
                    )}
                    style={style}
                    {...props}
                />
                {error && <span className="mt-0.5 text-xs text-danger">{String(error)}</span>}
            </div>
        );
    },
);

NumberField.displayName = "NumberField";

export default NumberField;
